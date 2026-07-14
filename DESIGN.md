# DESIGN.md

## Schema Overview

```
users (id, email, password_hash, created_at)
  │
  ├─< wallet_balances (user_id, currency_id) ─> currencies
  │     PK(user_id, currency_id)   CHECK(balance_in_credits >= 0)
  │
  ├─< campaigns (user_id, currency_id) ─> currencies
  │     status: CREATED | FUNDED   currency_id bound to module=CAMPAIGN via trigger
  │
  ├─< ledger (user_id, currency_id) ─> currencies
  │     reason: PURCHASE | CAMPAIGN_SPEND   payment_id UNIQUE (nullable)
  │     campaign_id ─> campaigns (nullable)   CHECK(amount_in_credits <> 0)
  │
  └─< stripe_events
        stripe_event_id UNIQUE   processed: boolean

currencies (id, name, module, price_in_paise, plans, created_at)
  module: CAMPAIGN | REPORT | DISCOVERY   plans: JSON bundle list
```

`wallet_balances` has a **composite primary key** `(user_id, currency_id)` — stronger than a separate id + unique index, and it's the row `FOR UPDATE` locks target. `campaigns.currency_id` is bound to the `CAMPAIGN` module by a DB trigger (see below), not a literal value.

## Key Design Decisions

**Currencies as configurable data.** `currencies.module` binds each row to the subsystem allowed to spend it; `plans` (JSON) holds bundle pricing, `price_in_paise` the per-credit rate for custom quantities. Both are seeded, not hardcoded — adding a fourth currency needs a seed row, not a code change.

**Currency↔module binding.** A literal `CHECK` constraint can't express "`currency_id` must reference whatever currency has `module='CAMPAIGN'`" — MySQL/MariaDB `CHECK` can't do cross-table lookups, and hardcoding a specific id would break "seeded, not hardcoded" (the id isn't even known until the seed script runs, after migrations). Instead, a `BEFORE INSERT`/`BEFORE UPDATE` trigger on `campaigns` looks up the referenced currency's module and rejects the write if it isn't `CAMPAIGN`. `fundCampaign` independently re-validates the same binding in application code before spending — two layers, verified separately in tests, neither relying on the other.

**Idempotency.** Two independent unique constraints, not app-level checks: `stripe_events.stripe_event_id` (has this webhook *delivery* been processed) and `ledger.payment_id` (has this *payment* already granted credits — set to the Checkout Session id, so a second event referencing the same payment is still caught). `grantCredits` claims the event with a plain `INSERT` and catches `UniqueConstraintError` rather than Sequelize's `findOrCreate` — load-testing surfaced a real bug where `findOrCreate`'s internal `SAVEPOINT` retry failed intermittently on MariaDB under concurrent duplicate deliveries (`SAVEPOINT ... does not exist`); the explicit insert-and-catch avoids that internal retry path.

**Transactions & concurrency.** Every balance mutation runs inside one `sequelize.transaction()` with `SELECT ... FOR UPDATE` on the row being changed (`wallet_balances`, and `campaigns` for funding). A concurrent request against the same row blocks on the lock and re-reads the post-commit state, instead of racing on a stale read.

**Ledger as source of truth.** `wallet_balances` is a running total; `ledger` is the append-only record of every movement, signed (+purchase, −spend) and tagged with a reason and either `payment_id` or `campaign_id`. `balance = SUM(ledger)` is always reconstructable even if the cached total were lost.

## Critical Flows

**Buy Credits:** `POST /wallet/buy` computes the amount server-side from `currencies` (never trusts the client) and creates a Stripe Checkout Session with `metadata={userId,currencyId,credits}`. The browser redirects to Stripe. **Payment happens entirely on Stripe's page** — no app code runs. Stripe calls `POST /webhooks/stripe` with the raw body (mounted before the JSON parser, since signature verification needs exact bytes). An invalid signature is rejected before any DB access. A valid `checkout.session.completed` calls `grantCredits`: claim the event → lock the wallet row → increment → insert ledger → mark processed, all in one transaction that fully rolls back on any error.

**Fund Campaign:** `POST /campaigns/:id/fund` opens one transaction: lock the campaign row (not found → 404, already `FUNDED` → 409), re-validate currency binding, lock the wallet row, check `balance >= amount` (insufficient → rollback, 422, nothing touched), then decrement, mark `FUNDED`, and insert a `CAMPAIGN_SPEND` ledger row.

## Acceptance Criteria Coverage

- **balance = SUM(ledger):** every balance write has exactly one ledger row in the same transaction; nothing else touches `wallet_balances`.
- **Duplicate webhooks:** `stripe_event_id` uniqueness, claimed before any balance mutation.
- **Currency isolation:** campaigns are only ever created bound to Campaign Credits; the trigger and service check both independently reject anything else.
- **No negative balance:** the `FOR UPDATE` lock + pre-check makes this hold in normal operation; the `CHECK(balance>=0)` constraint is the last-resort backstop.
- **Campaign funded once:** the campaign row lock serializes concurrent fund attempts on the same campaign; status is checked before any mutation.

## Known Limitations / Improvements

Not implemented: refunds/chargebacks (no ledger reversal reason), rate limiting, an idempotency key on `POST /wallet/buy` itself (double-clicking creates two Checkout Sessions — harmless since only a completed one grants credits, but wasteful), structured logging/request tracing (currently just `console.error`), and audit logging for admin-style actions. Ledger pagination is offset-based, fine at this scale but not at high volume. Frontend styling is intentionally minimal — time went into correctness (transactions, locking, idempotency) and the test suite over visual polish.
