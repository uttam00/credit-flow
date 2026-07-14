import { UniqueConstraintError } from 'sequelize';
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

export class WalletNotInitializedError extends Error {
  constructor(userId: number, currencyId: number) {
    super(`Wallet balance row missing for user ${userId} currency ${currencyId}`);
    this.name = 'WalletNotInitializedError';
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
 *  - `stripe_events.stripe_event_id` is unique. This claims that row with a
 *    plain INSERT rather than Sequelize's findOrCreate — findOrCreate
 *    retries a failed insert via a SAVEPOINT, and under concurrent
 *    duplicate deliveries on MariaDB that retry can itself fail with
 *    "SAVEPOINT ... does not exist" once the savepoint is released by the
 *    time the rollback runs. Catching the UniqueConstraintError directly
 *    avoids that internal retry path entirely: the loser's insert blocks on
 *    the winner's row lock, then fails with a duplicate-key error once
 *    unblocked, which is caught here and treated as "already processed".
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
    let claimedThisEvent: boolean;
    try {
      await StripeEvent.create(
        { stripeEventId, userId, eventType, data: eventData, processed: false },
        { transaction },
      );
      claimedThisEvent = true;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        claimedThisEvent = false;
      } else {
        throw error;
      }
    }

    if (!claimedThisEvent) {
      return;
    }

    const currency = await Currency.findByPk(currencyId, { transaction });
    if (!currency) {
      throw new CurrencyNotFoundError(currencyId);
    }

    // Every user gets a zero-balance row per currency at signup
    // (walletService.initializeWallet), so this row should always already
    // exist; a plain locked lookup surfaces a missing row as a loud error
    // instead of silently materializing one outside that guaranteed path.
    const walletBalance = await WalletBalance.findOne({
      where: { userId, currencyId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!walletBalance) {
      throw new WalletNotInitializedError(userId, currencyId);
    }

    await walletBalance.increment('balanceInCredits', { by: amount, transaction });

    await Ledger.create(
      { userId, currencyId, amountInCredits: amount, reason, paymentId },
      { transaction },
    );

    await StripeEvent.update({ processed: true }, { where: { stripeEventId }, transaction });
  });
}
