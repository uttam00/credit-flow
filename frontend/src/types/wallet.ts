export type CurrencyModule = 'CAMPAIGN' | 'REPORT' | 'DISCOVERY';

export interface CurrencyBalance {
  currencyId: number;
  currencyName: string;
  module: CurrencyModule;
  balanceInCredits: number;
}

export interface LedgerEntry {
  id: number;
  amountInCredits: number;
  reason: 'PURCHASE' | 'CAMPAIGN_SPEND';
  paymentId: string | null;
  campaignId: number | null;
  createdAt: string;
}

export interface LedgerPage {
  entries: LedgerEntry[];
  page: number;
  pageSize: number;
  totalCount: number;
}
