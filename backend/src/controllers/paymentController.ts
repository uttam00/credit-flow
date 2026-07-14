import { Request, Response } from 'express';
import Stripe from 'stripe';
import { Currency } from '../models/Currency';
import { User } from '../models/User';
import { createCheckoutSession, parseWebhookEvent } from '../services/stripeService';
import { grantCredits } from '../services/paymentService';

interface BuyRequestBody {
  currencyId?: unknown;
  planIndex?: unknown;
  quantity?: unknown;
}

export async function buyHandler(req: Request, res: Response): Promise<void> {
  const { currencyId, planIndex, quantity } = req.body as BuyRequestBody;

  if (typeof currencyId !== 'number' || !Number.isInteger(currencyId) || currencyId <= 0) {
    res.status(400).json({ error: 'A valid currencyId is required' });
    return;
  }

  const currency = await Currency.findByPk(currencyId);
  if (!currency) {
    res.status(400).json({ error: 'Currency not found' });
    return;
  }

  let credits: number;
  let amountInPaise: number;

  if (typeof planIndex === 'number') {
    const plan = currency.plans[planIndex];
    if (!plan) {
      res.status(400).json({ error: 'Invalid plan selected' });
      return;
    }
    credits = plan.credits;
    amountInPaise = plan.priceInPaise;
  } else if (typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0) {
    credits = quantity;
    amountInPaise = quantity * currency.priceInPaise;
  } else {
    res.status(400).json({ error: 'Provide either a valid planIndex or a positive integer quantity' });
    return;
  }

  if (amountInPaise <= 0) {
    res.status(400).json({ error: 'Computed amount must be greater than zero' });
    return;
  }

  const user = await User.findByPk(req.user!.userId);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const url = await createCheckoutSession({
    userId: user.id,
    currencyId: currency.id,
    currencyName: currency.name,
    credits,
    amountInPaise,
    customerEmail: user.email,
  });

  res.status(200).json({ url });
}

export async function webhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing Stripe-Signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = parseWebhookEvent(req.body as Buffer, signature);
  } catch {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  if (event.type !== 'checkout.session.completed') {
    res.status(200).json({ received: true });
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = Number(session.metadata?.userId);
  const currencyId = Number(session.metadata?.currencyId);
  const credits = Number(session.metadata?.credits);

  if (
    !Number.isInteger(userId) ||
    !Number.isInteger(currencyId) ||
    !Number.isInteger(credits) ||
    credits <= 0
  ) {
    res.status(400).json({ error: 'Malformed checkout session metadata' });
    return;
  }

  await grantCredits({
    userId,
    currencyId,
    amount: credits,
    stripeEventId: event.id,
    paymentId: session.id,
    eventType: event.type,
    reason: 'PURCHASE',
    eventData: event as unknown as Record<string, unknown>,
  });

  res.status(200).json({ received: true });
}
