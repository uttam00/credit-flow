import { Request, Response } from 'express';
import { Currency } from '../models/Currency';
import { getBalances, getLedger } from '../services/walletService';

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getBalanceHandler(req: Request, res: Response): Promise<void> {
  const balances = await getBalances(req.user!.userId);
  res.status(200).json({
    balances,
    _links: { self: { href: '/wallet/balance' } },
  });
}

export async function getLedgerHandler(req: Request, res: Response): Promise<void> {
  const currencyId = Number(req.query.currency_id);
  if (!Number.isInteger(currencyId) || currencyId <= 0) {
    res.status(400).json({ error: 'A valid currency_id query parameter is required' });
    return;
  }

  const currency = await Currency.findByPk(currencyId);
  if (!currency) {
    res.status(404).json({ error: 'Currency not found' });
    return;
  }

  const page = parsePositiveInt(req.query.page, 1);
  const pageSize = parsePositiveInt(req.query.page_size, 20);

  const result = await getLedger(req.user!.userId, currencyId, page, pageSize);

  res.status(200).json({
    ...result,
    _links: {
      self: {
        href: `/wallet/ledger?currency_id=${currencyId}&page=${result.page}&page_size=${result.pageSize}`,
      },
    },
  });
}
