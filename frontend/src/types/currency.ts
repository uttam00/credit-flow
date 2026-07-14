export type CurrencyModule = 'CAMPAIGN' | 'REPORT' | 'DISCOVERY';

export interface CurrencyPlan {
  credits: number;
  priceInPaise: number;
}

export interface CurrencyInfo {
  id: number;
  name: string;
  module: CurrencyModule;
  priceInPaise: number;
  plans: CurrencyPlan[];
}
