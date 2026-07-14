import { api } from './api';

export interface BuyCreditsRequest {
  currencyId: number;
  planIndex?: number;
  quantity?: number;
}

export async function buyCredits(request: BuyCreditsRequest): Promise<string> {
  const response = await api.post<{ url: string }>('/wallet/buy', request);
  return response.data.url;
}
