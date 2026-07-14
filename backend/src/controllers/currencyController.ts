import { Request, Response } from 'express';
import { Currency } from '../models/Currency';

export async function listCurrenciesHandler(_req: Request, res: Response): Promise<void> {
  const currencies = await Currency.findAll({ order: [['id', 'ASC']] });
  res.status(200).json({
    currencies: currencies.map((currency) => ({
      id: currency.id,
      name: currency.name,
      module: currency.module,
      priceInPaise: currency.priceInPaise,
      plans: currency.plans,
    })),
  });
}
