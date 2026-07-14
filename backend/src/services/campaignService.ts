import { sequelize } from '../database/sequelize';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { Currency } from '../models/Currency';
import { WalletBalance } from '../models/WalletBalance';
import { Ledger } from '../models/Ledger';
import { validateCurrencyBelongsToModule } from './walletService';

export class CampaignNotFoundError extends Error {
  constructor(campaignId: number) {
    super(`Campaign ${campaignId} not found`);
    this.name = 'CampaignNotFoundError';
  }
}

export class CampaignAlreadyFundedError extends Error {
  constructor(campaignId: number) {
    super(`Campaign ${campaignId} has already been funded`);
    this.name = 'CampaignAlreadyFundedError';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(campaignId: number, requested: number, available: number) {
    super(
      `Insufficient balance to fund campaign ${campaignId}: requested ${requested}, available ${available}`,
    );
    this.name = 'InsufficientBalanceError';
  }
}

export interface CampaignSummary {
  id: number;
  name: string;
  currencyId: number;
  fundedAmountInCredits: number;
  status: CampaignStatus;
  createdAt: Date;
}

function toSummary(campaign: Campaign): CampaignSummary {
  return {
    id: campaign.id,
    name: campaign.name,
    currencyId: campaign.currencyId,
    fundedAmountInCredits: campaign.fundedAmountInCredits,
    status: campaign.status,
    createdAt: campaign.createdAt,
  };
}

async function getCampaignCreditsCurrency(): Promise<Currency> {
  const currency = await Currency.findOne({ where: { module: 'CAMPAIGN' } });
  if (!currency) {
    throw new Error('No currency is bound to the CAMPAIGN module');
  }
  return currency;
}

export async function createCampaign(userId: number, name: string): Promise<CampaignSummary> {
  const currency = await getCampaignCreditsCurrency();
  const campaign = await Campaign.create({ userId, currencyId: currency.id, name });
  return toSummary(campaign);
}

export async function listCampaigns(userId: number): Promise<CampaignSummary[]> {
  const campaigns = await Campaign.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
  return campaigns.map(toSummary);
}

/**
 * Funds a campaign from the user's Campaign Credits balance. Uses a single
 * transaction with row-level locks on both the campaign and the wallet
 * balance:
 *  - Locking the campaign row means a second concurrent fund attempt for the
 *    same campaign blocks until the first commits, then sees status=FUNDED
 *    and is rejected — "funded at most once" holds under concurrency, not
 *    just sequentially.
 *  - Locking the wallet_balance row means the insufficient-balance check
 *    can't race: two concurrent funds against the same wallet can't both
 *    read the pre-spend balance and both conclude they have enough.
 * Currency binding is re-validated here (defense in depth) even though
 * createCampaign always sets currencyId to the Campaign Credits currency —
 * the DB trigger from migration 20260714120007 enforces the same invariant
 * independently.
 */
export async function fundCampaign(
  userId: number,
  campaignId: number,
  amountInCredits: number,
): Promise<void> {
  if (!Number.isInteger(amountInCredits) || amountInCredits <= 0) {
    throw new Error('amountInCredits must be a positive integer');
  }

  await sequelize.transaction(async (transaction) => {
    const campaign = await Campaign.findOne({
      where: { id: campaignId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!campaign) {
      throw new CampaignNotFoundError(campaignId);
    }
    if (campaign.status === 'FUNDED') {
      throw new CampaignAlreadyFundedError(campaignId);
    }

    await validateCurrencyBelongsToModule(campaign.currencyId, 'CAMPAIGN', transaction);

    const walletBalance = await WalletBalance.findOne({
      where: { userId, currencyId: campaign.currencyId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!walletBalance || walletBalance.balanceInCredits < amountInCredits) {
      throw new InsufficientBalanceError(
        campaignId,
        amountInCredits,
        walletBalance?.balanceInCredits ?? 0,
      );
    }

    await walletBalance.decrement('balanceInCredits', { by: amountInCredits, transaction });

    campaign.fundedAmountInCredits = amountInCredits;
    campaign.status = 'FUNDED';
    await campaign.save({ transaction });

    await Ledger.create(
      {
        userId,
        currencyId: campaign.currencyId,
        amountInCredits: -amountInCredits,
        reason: 'CAMPAIGN_SPEND',
        campaignId: campaign.id,
      },
      { transaction },
    );
  });
}
