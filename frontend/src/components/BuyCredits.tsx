import { useEffect, useState } from 'react';
import { getCurrencies } from '../services/currencies';
import { buyCredits } from '../services/payment';
import type { CurrencyInfo } from '../types/currency';

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

function BuyCredits() {
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [mode, setMode] = useState<'plan' | 'quantity'>('plan');
  const [planIndex, setPlanIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrencies()
      .then((data) => {
        setCurrencies(data);
        if (data.length > 0) {
          setCurrencyId(data[0].id);
        }
      })
      .catch(() => setLoadError('Failed to load currencies'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (loadError || currencyId === null) {
    return <p role="alert">{loadError ?? 'No currencies available'}</p>;
  }

  const currency = currencies.find((entry) => entry.id === currencyId) ?? currencies[0];
  const displayAmountInPaise =
    mode === 'plan' ? currency.plans[planIndex].priceInPaise : quantity * currency.priceInPaise;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const url = await buyCredits(
        mode === 'plan' ? { currencyId: currencyId!, planIndex } : { currencyId: currencyId!, quantity },
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
          {currencies.map((entry) => (
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
