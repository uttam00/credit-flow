import { Transaction } from 'sequelize';
import { Currency, CurrencyModule } from '../models/Currency';
import { WalletBalance } from '../models/WalletBalance';
import { Ledger, LedgerReason } from '../models/Ledger';

export interface CurrencyBalance {
  currencyId: number;
  currencyName: string;
  module: CurrencyModule;
  balanceInCredits: number;
}

export interface LedgerEntry {
  id: number;
  amountInCredits: number;
  reason: LedgerReason;
  paymentId: string | null;
  campaignId: number | null;
  createdAt: Date;
}

export interface LedgerPage {
  entries: LedgerEntry[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export class InvalidCurrencyModuleError extends Error {
  constructor(currencyId: number, expectedModule: CurrencyModule) {
    super(`Currency ${currencyId} is not bound to module ${expectedModule}`);
    this.name = 'InvalidCurrencyModuleError';
  }
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function initializeWallet(userId: number, transaction: Transaction): Promise<void> {
  const currencies = await Currency.findAll({ transaction });

  await WalletBalance.bulkCreate(
    currencies.map((currency) => ({
      userId,
      currencyId: currency.id,
      balanceInCredits: 0,
    })),
    { transaction, ignoreDuplicates: true },
  );
}

export async function getBalances(userId: number): Promise<CurrencyBalance[]> {
  const [currencies, balances] = await Promise.all([
    Currency.findAll({ order: [['id', 'ASC']] }),
    WalletBalance.findAll({ where: { userId } }),
  ]);

  const balanceByCurrencyId = new Map(balances.map((b) => [b.currencyId, b.balanceInCredits]));

  return currencies.map((currency) => ({
    currencyId: currency.id,
    currencyName: currency.name,
    module: currency.module,
    balanceInCredits: balanceByCurrencyId.get(currency.id) ?? 0,
  }));
}

export async function getLedger(
  userId: number,
  currencyId: number,
  page: number,
  pageSize: number,
): Promise<LedgerPage> {
  const clampedPage = Math.max(Math.trunc(page) || 1, 1);
  const clampedPageSize = Math.min(Math.max(Math.trunc(pageSize) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

  const { rows, count } = await Ledger.findAndCountAll({
    where: { userId, currencyId },
    order: [['createdAt', 'DESC']],
    limit: clampedPageSize,
    offset: (clampedPage - 1) * clampedPageSize,
  });

  return {
    entries: rows.map((row) => ({
      id: row.id,
      amountInCredits: row.amountInCredits,
      reason: row.reason,
      paymentId: row.paymentId,
      campaignId: row.campaignId,
      createdAt: row.createdAt,
    })),
    page: clampedPage,
    pageSize: clampedPageSize,
    totalCount: count,
  };
}

export async function validateCurrencyBelongsToModule(
  currencyId: number,
  expectedModule: CurrencyModule,
  transaction?: Transaction,
): Promise<Currency> {
  const currency = await Currency.findByPk(currencyId, { transaction });
  if (!currency || currency.module !== expectedModule) {
    throw new InvalidCurrencyModuleError(currencyId, expectedModule);
  }
  return currency;
}
