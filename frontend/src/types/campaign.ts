export type CampaignStatus = 'CREATED' | 'FUNDED';

export interface Campaign {
  id: number;
  name: string;
  currencyId: number;
  fundedAmountInCredits: number;
  status: CampaignStatus;
  createdAt: string;
}
