import { sequelize } from '../database/sequelize';
import { StripeEvent } from '../models/StripeEvent';
import { WalletBalance } from '../models/WalletBalance';
import { Ledger } from '../models/Ledger';
import { Currency } from '../models/Currency';

export class CurrencyNotFoundError extends Error {
  constructor(currencyId: number) {
    super(`Currency ${currencyId} does not exist`);
    this.name = 'CurrencyNotFoundError';
  }
}

export interface GrantCreditsParams {
  userId: number;
  currencyId: number;
  amount: number;
  stripeEventId: string;
  paymentId: string;
  eventType: string;
  reason: 'PURCHASE';
  eventData: Record<string, unknown>;
}

/**
 * Grants credits for a completed Stripe payment. Idempotent at the database
 * level, not just in application logic:
 *  - `stripe_events.stripe_event_id` is unique, and StripeEvent.findOrCreate
 *    claims that row before any balance mutation happens. If two duplicate
 *    webhook deliveries race here, only one wins the insert; the other sees
 *    `created: false` and returns without touching the wallet.
 *  - `ledger.payment_id` is independently unique, so even a *different*
 *    event referencing the same underlying payment can't grant credits
 *    twice.
 * The wallet_balance row is locked with SELECT ... FOR UPDATE for the
 * duration of the transaction so a concurrent spend against the same
 * currency can't interleave with the increment.
 */
export async function grantCredits(params: GrantCreditsParams): Promise<void> {
  const { userId, currencyId, amount, stripeEventId, paymentId, eventType, reason, eventData } = params;

  if (amount <= 0) {
    throw new Error('amount must be greater than zero');
  }

  await sequelize.transaction(async (transaction) => {
    const [, created] = await StripeEvent.findOrCreate({
      where: { stripeEventId },
      defaults: { stripeEventId, userId, eventType, data: eventData, processed: false },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!created) {
      return;
    }

    const currency = await Currency.findByPk(currencyId, { transaction });
    if (!currency) {
      throw new CurrencyNotFoundError(currencyId);
    }

    const [walletBalance] = await WalletBalance.findOrCreate({
      where: { userId, currencyId },
      defaults: { userId, currencyId, balanceInCredits: 0 },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    await walletBalance.increment('balanceInCredits', { by: amount, transaction });

    await Ledger.create(
      { userId, currencyId, amountInCredits: amount, reason, paymentId },
      { transaction },
    );

    await StripeEvent.update({ processed: true }, { where: { stripeEventId }, transaction });
  });
}
