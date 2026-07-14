import request from 'supertest';
import Stripe from 'stripe';
import { app } from '../app';
import { Currency, CurrencyModule } from '../models/Currency';
import { WalletBalance } from '../models/WalletBalance';

let userCounter = 0;

export function uniqueEmail(prefix: string): string {
  userCounter += 1;
  return `${prefix}-${Date.now()}-${userCounter}@example.test`;
}

export interface TestUser {
  userId: number;
  email: string;
  token: string;
}

export async function createTestUser(prefix = 'user'): Promise<TestUser> {
  const email = uniqueEmail(prefix);
  const password = 'correcthorse123';

  const signupResponse = await request(app).post('/auth/signup').send({ email, password });
  if (signupResponse.status !== 201) {
    throw new Error(`Signup failed: ${JSON.stringify(signupResponse.body)}`);
  }

  const loginResponse = await request(app).post('/auth/login').send({ email, password });
  if (loginResponse.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
  }

  return {
    userId: signupResponse.body.user.id as number,
    email,
    token: loginResponse.body.token as string,
  };
}

export async function getCurrencyIdByModule(currencyModule: CurrencyModule): Promise<number> {
  const currency = await Currency.findOne({ where: { module: currencyModule } });
  if (!currency) {
    throw new Error(`No seeded currency for module ${currencyModule}`);
  }
  return currency.id;
}

/**
 * Test-only shortcut to put a wallet in a known balance state without going
 * through Stripe. Funding/webhook tests are about the funding and webhook
 * logic, not the purchase flow itself (that's covered by the webhook tests).
 */
export async function setBalance(userId: number, currencyId: number, balance: number): Promise<void> {
  await WalletBalance.upsert({ userId, currencyId, balanceInCredits: balance });
}

export function signStripeEvent(payload: string, secret: string): string {
  return Stripe.webhooks.generateTestHeaderString({ payload, secret });
}

export function makeCheckoutCompletedEvent(params: {
  eventId: string;
  sessionId: string;
  userId: number;
  currencyId: number;
  credits: number;
}): string {
  return JSON.stringify({
    id: params.eventId,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: params.sessionId,
        object: 'checkout.session',
        metadata: {
          userId: String(params.userId),
          currencyId: String(params.currencyId),
          credits: String(params.credits),
        },
      },
    },
  });
}
