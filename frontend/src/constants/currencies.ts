export interface CurrencyPlan {
  credits: number;
  priceInPaise: number;
}

export interface CurrencyCatalogEntry {
  id: number;
  name: string;
  priceInPaise: number;
  plans: CurrencyPlan[];
}

// Hard-coded to match the seeded currencies until a public /currencies
// endpoint exists. The backend never trusts these values — it recomputes
// the amount from the database on every purchase.
export const CURRENCY_CATALOG: CurrencyCatalogEntry[] = [
  {
    id: 1,
    name: 'Campaign Credits',
    priceInPaise: 300,
    plans: [
      { credits: 100, priceInPaise: 30_000 },
      { credits: 1000, priceInPaise: 270_000 },
    ],
  },
  {
    id: 2,
    name: 'Report Credits',
    priceInPaise: 1000,
    plans: [
      { credits: 10, priceInPaise: 10_000 },
      { credits: 100, priceInPaise: 90_000 },
    ],
  },
  {
    id: 3,
    name: 'Discovery Credits',
    priceInPaise: 500,
    plans: [
      { credits: 100, priceInPaise: 50_000 },
      { credits: 1000, priceInPaise: 450_000 },
    ],
  },
];
