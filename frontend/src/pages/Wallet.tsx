import { useEffect, useState } from 'react';
import { getBalances, getLedger } from '../services/wallet';
import type { CurrencyBalance, LedgerEntry } from '../types/wallet';

function Wallet() {
  const [balances, setBalances] = useState<CurrencyBalance[]>([]);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBalances()
      .then((data) => {
        setBalances(data);
        if (data.length > 0) {
          setSelectedCurrencyId(data[0].currencyId);
        }
      })
      .catch(() => setError('Failed to load wallet balances'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCurrencyId === null) {
      return;
    }
    getLedger(selectedCurrencyId)
      .then((page) => setLedger(page.entries))
      .catch(() => setError('Failed to load ledger'));
  }, [selectedCurrencyId]);

  if (loading) {
    return <p>Loading wallet...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <div>
      <h1>Wallet</h1>
      <ul>
        {balances.map((balance) => (
          <li key={balance.currencyId}>
            <button
              type="button"
              onClick={() => setSelectedCurrencyId(balance.currencyId)}
              aria-current={balance.currencyId === selectedCurrencyId}
            >
              {balance.currencyName}: {balance.balanceInCredits} credits
            </button>
          </li>
        ))}
      </ul>
      <button type="button" disabled title="Coming soon">
        Buy Credits
      </button>

      <h2>Ledger</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Reason</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {ledger.length === 0 ? (
            <tr>
              <td colSpan={3}>No ledger entries yet</td>
            </tr>
          ) : (
            ledger.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.createdAt).toLocaleString()}</td>
                <td>{entry.reason}</td>
                <td>{entry.amountInCredits}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Wallet;
