import { useState } from 'react';
import { CURRENCY_CATALOG } from '../constants/currencies';
import { buyCredits } from '../services/payment';

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function BuyCredits() {
  const [currencyId, setCurrencyId] = useState(CURRENCY_CATALOG[0].id);
  const [mode, setMode] = useState<'plan' | 'quantity'>('plan');
  const [planIndex, setPlanIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = CURRENCY_CATALOG.find((entry) => entry.id === currencyId) ?? CURRENCY_CATALOG[0];
  const displayAmountInPaise =
    mode === 'plan' ? currency.plans[planIndex].priceInPaise : quantity * currency.priceInPaise;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const url = await buyCredits(
        mode === 'plan' ? { currencyId, planIndex } : { currencyId, quantity },
      );
      window.location.href = url;
    } catch {
      setError('Could not start checkout. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Buy Credits</h1>
      {error && <p role="alert">{error}</p>}

      <label>
        Currency
        <select
          value={currencyId}
          onChange={(event) => {
            setCurrencyId(Number(event.target.value));
            setPlanIndex(0);
          }}
        >
          {CURRENCY_CATALOG.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend>How many credits?</legend>
        <label>
          <input type="radio" checked={mode === 'plan'} onChange={() => setMode('plan')} />
          Choose a plan
        </label>
        {mode === 'plan' && (
          <select value={planIndex} onChange={(event) => setPlanIndex(Number(event.target.value))}>
            {currency.plans.map((plan, index) => (
              <option key={plan.credits} value={index}>
                {plan.credits} credits — {formatRupees(plan.priceInPaise)}
              </option>
            ))}
          </select>
        )}

        <label>
          <input type="radio" checked={mode === 'quantity'} onChange={() => setMode('quantity')} />
          Custom quantity
        </label>
        {mode === 'quantity' && (
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        )}
      </fieldset>

      <p>Total: {formatRupees(displayAmountInPaise)}</p>

      <button type="button" onClick={handleSubmit} disabled={submitting}>
        Proceed to Stripe
      </button>
    </div>
  );
}

export default BuyCredits;
