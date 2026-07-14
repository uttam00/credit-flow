import 'dotenv/config';
import { sequelize } from './sequelize';
import { Currency, CurrencyModule, CurrencyPlan } from '../models/Currency';

interface CurrencySeed {
  name: string;
  module: CurrencyModule;
  priceInPaise: number;
  plans: CurrencyPlan[];
}

const currencies: CurrencySeed[] = [
  {
    name: 'Campaign Credits',
    module: 'CAMPAIGN',
    priceInPaise: 300,
    plans: [
      { credits: 100, priceInPaise: 30_000 },
      { credits: 1000, priceInPaise: 270_000 },
    ],
  },
  {
    name: 'Report Credits',
    module: 'REPORT',
    priceInPaise: 1000,
    plans: [
      { credits: 10, priceInPaise: 10_000 },
      { credits: 100, priceInPaise: 90_000 },
    ],
  },
  {
    name: 'Discovery Credits',
    module: 'DISCOVERY',
    priceInPaise: 500,
    plans: [
      { credits: 100, priceInPaise: 50_000 },
      { credits: 1000, priceInPaise: 450_000 },
    ],
  },
];

async function seed(): Promise<void> {
  await sequelize.authenticate();

  for (const currency of currencies) {
    await Currency.upsert(currency);
  }

  console.log(`Seeded ${currencies.length} currencies`);
}

seed()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
