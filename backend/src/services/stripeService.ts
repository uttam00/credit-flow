import Stripe from 'stripe';

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey);
}

export interface CreateCheckoutSessionParams {
  userId: number;
  currencyId: number;
  currencyName: string;
  credits: number;
  amountInPaise: number;
  customerEmail: string;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<string> {
  if (params.amountInPaise <= 0) {
    throw new Error('amountInPaise must be greater than zero');
  }

  const stripe = getStripeClient();
  const successUrl = process.env.STRIPE_SUCCESS_URL ?? 'http://localhost:5173/buy/return';
  const cancelUrl = process.env.STRIPE_CANCEL_URL ?? 'http://localhost:5173/buy/return';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: { name: `${params.currencyName} (${params.credits} credits)` },
          unit_amount: params.amountInPaise,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: String(params.userId),
      currencyId: String(params.currencyId),
      credits: String(params.credits),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout session URL');
  }

  return session.url;
}

/**
 * Verifies the Stripe-Signature header and parses the event body in a
 * single call. Stripe's constructEvent fuses these two steps by design —
 * splitting "verify" from "parse" into independent functions would allow a
 * body to be parsed before its signature is checked, which is exactly what
 * signature verification exists to prevent. Throws if the signature is
 * missing, forged, or doesn't match the configured webhook secret.
 */
export function parseWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
}
