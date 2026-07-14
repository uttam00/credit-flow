import { api } from './api';
import type { Campaign } from '../types/campaign';

export async function listCampaigns(): Promise<Campaign[]> {
  const response = await api.get<{ campaigns: Campaign[] }>('/campaigns');
  return response.data.campaigns;
}

export async function createCampaign(name: string): Promise<Campaign> {
  const response = await api.post<{ campaign: Campaign }>('/campaigns', { name });
  return response.data.campaign;
}

export async function fundCampaign(id: number, amountInCredits: number): Promise<void> {
  await api.post(`/campaigns/${id}/fund`, { amountInCredits });
}
