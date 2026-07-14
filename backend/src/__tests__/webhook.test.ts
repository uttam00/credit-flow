import request from 'supertest';
import { app } from '../app';
import { sequelize } from '../database/sequelize';
import { WalletBalance } from '../models/WalletBalance';
import { Ledger } from '../models/Ledger';
import { StripeEvent } from '../models/StripeEvent';
import { createTestUser, getCurrencyIdByModule, signStripeEvent, makeCheckoutCompletedEvent } from './helpers';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

function postWebhook(payload: string, signature: string) {
  return request(app)
    .post('/webhooks/stripe')
    .set('Content-Type', 'application/json')
    .set('Stripe-Signature', signature)
    .send(payload);
}

describe('POST /webhooks/stripe', () => {
  afterAll(async () => {
    await sequelize.close();
  });

  test('duplicate webhook delivery grants credits exactly once', async () => {
    const user = await createTestUser('webhook-dup');
    const currencyId = await getCurrencyIdByModule('CAMPAIGN');
    const payload = makeCheckoutCompletedEvent({
      eventId: `evt_test_dup_${Date.now()}`,
      sessionId: `cs_test_dup_${Date.now()}`,
      userId: user.userId,
      currencyId,
      credits: 100,
    });
    const signature = signStripeEvent(payload, WEBHOOK_SECRET);

    const first = await postWebhook(payload, signature);
    expect(first.status).toBe(200);

    const second = await postWebhook(payload, signature);
    expect(second.status).toBe(200);

    const balance = await WalletBalance.findOne({ where: { userId: user.userId, currencyId } });
    expect(balance?.balanceInCredits).toBe(100);

    const ledgerEntries = await Ledger.findAll({ where: { userId: user.userId, currencyId } });
    expect(ledgerEntries).toHaveLength(1);
    expect(ledgerEntries[0].amountInCredits).toBe(100);
  });

  test('forged webhook signature is rejected and grants no credits', async () => {
    const user = await createTestUser('webhook-forged');
    const currencyId = await getCurrencyIdByModule('CAMPAIGN');
    const eventId = `evt_test_forged_${Date.now()}`;
    const payload = makeCheckoutCompletedEvent({
      eventId,
      sessionId: `cs_test_forged_${Date.now()}`,
      userId: user.userId,
      currencyId,
      credits: 500,
    });
    const forgedSignature = signStripeEvent(payload, 'whsec_attacker_controlled_secret');

    const response = await postWebhook(payload, forgedSignature);
    expect([401, 403]).toContain(response.status);

    const balance = await WalletBalance.findOne({ where: { userId: user.userId, currencyId } });
    expect(balance?.balanceInCredits ?? 0).toBe(0);

    const event = await StripeEvent.findOne({ where: { stripeEventId: eventId } });
    expect(event).toBeNull();
  });

  test('concurrent duplicate webhook deliveries still grant credits exactly once', async () => {
    const user = await createTestUser('webhook-race');
    const currencyId = await getCurrencyIdByModule('CAMPAIGN');
    const payload = makeCheckoutCompletedEvent({
      eventId: `evt_test_race_${Date.now()}`,
      sessionId: `cs_test_race_${Date.now()}`,
      userId: user.userId,
      currencyId,
      credits: 250,
    });
    const signature = signStripeEvent(payload, WEBHOOK_SECRET);

    const [first, second] = await Promise.all([
      postWebhook(payload, signature),
      postWebhook(payload, signature),
    ]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const balance = await WalletBalance.findOne({ where: { userId: user.userId, currencyId } });
    expect(balance?.balanceInCredits).toBe(250);

    const ledgerEntries = await Ledger.findAll({ where: { userId: user.userId, currencyId } });
    expect(ledgerEntries).toHaveLength(1);
  });
});
