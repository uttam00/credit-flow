import { api } from './api';
import type { CurrencyInfo } from '../types/currency';

export async function getCurrencies(): Promise<CurrencyInfo[]> {
  const response = await api.get<{ currencies: CurrencyInfo[] }>('/currencies');
  return response.data.currencies;
}
