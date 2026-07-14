import { api } from './api';
import type { CurrencyBalance, LedgerPage } from '../types/wallet';

export async function getBalances(): Promise<CurrencyBalance[]> {
  const response = await api.get<{ balances: CurrencyBalance[] }>('/wallet/balance');
  return response.data.balances;
}

export async function getLedger(currencyId: number, page = 1): Promise<LedgerPage> {
  const response = await api.get<LedgerPage>('/wallet/ledger', {
    params: { currency_id: currencyId, page },
  });
  return response.data;
}
