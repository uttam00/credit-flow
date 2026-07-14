# Credit Flow

Multi-currency credits wallet and campaign funding platform for an influencer-marketing product. Users buy credits in three independent currencies via Stripe and spend them within their bound modules (e.g. Campaign Credits fund campaigns).

## Structure

- `backend/` — Node.js + TypeScript + Express + Sequelize (MySQL)
- `frontend/` — React + Vite + TypeScript

## Prerequisites

- Node.js 20+
- MySQL 8.0.16+ or MariaDB 10.2.1+ (both are required for enforced `CHECK` constraints)

## Backend setup

```bash
cd backend
npm install
cp .env.example .env   # edit DB_* and JWT_SECRET as needed
```

Create the database (name must match `DB_NAME` in `.env`):

```sql
CREATE DATABASE credit_flow;
```

Run migrations:

```bash
npm run db:migrate
```

Seed the three platform currencies (Campaign, Report, Discovery Credits) and their plans:

```bash
npm run db:seed
```

Other useful commands:

```bash
npm run db:migrate:undo       # roll back the most recent migration
npm run db:migrate:undo:all   # roll back every migration
npm run dev                   # start the API in watch mode
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # edit VITE_API_URL if the backend isn't on localhost:3000
npm run dev
```

## Stripe test setup

Credits are only ever granted from a verified Stripe webhook, never from the browser redirect after checkout — so local testing needs the Stripe CLI to forward webhook events to your machine.

1. Create a free Stripe account and switch to **Test mode**.
2. Copy your test **Secret key** from the Stripe Dashboard into `backend/.env` as `STRIPE_SECRET_KEY`.
3. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and log in: `stripe login`.
4. Start the webhook forwarder, pointed at the backend:

   ```bash
   stripe listen --forward-to localhost:3000/webhooks/stripe
   ```

   This prints a webhook signing secret (`whsec_...`). Copy it into `backend/.env` as `STRIPE_WEBHOOK_SECRET`, then (re)start the backend.
5. With both the backend and `stripe listen` running, go through the app's buy-credits flow. On Stripe's hosted checkout page, use the test card:

   ```
   4242 4242 4242 4242
   Any future expiry date, any CVC, any postal code
   ```

6. After paying, Stripe sends `checkout.session.completed` to your forwarder, which relays it to `/webhooks/stripe`. Credits appear in the wallet once that webhook is processed — the return page in the browser never grants credits itself.

### Testing duplicate webhooks

To confirm a replayed webhook doesn't grant credits twice, find the event in the `stripe listen` output (or `stripe events list`) and resend it:

```bash
stripe events resend evt_...
```

The second delivery should still return `200`, but the ledger and wallet balance should be unchanged — `stripe_events.stripe_event_id` and `ledger.payment_id` are both unique at the database level, so a duplicate delivery is a no-op rather than a second credit grant.

## Running tests

### Backend

Tests run against a real, separate database (`<DB_NAME>_test`) — the correctness properties under test (idempotency, row locking, concurrent funding) depend on actual transaction and locking behavior that a mocked database can't reproduce.

```bash
cd backend
```

```sql
CREATE DATABASE credit_flow_test;
```

```bash
npm test
```

`npm test` migrates and seeds the test database automatically before running. Webhook signature tests sign their own test events locally using `STRIPE_WEBHOOK_SECRET` from `.env` — no live Stripe account is needed to run the suite.

### Frontend

```bash
cd frontend
npm test
```

Component tests mock the `services/*` API layer rather than hitting a real backend.
