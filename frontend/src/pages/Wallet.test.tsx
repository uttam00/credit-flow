import { describe, test, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/renderWithProviders';
import Wallet from './Wallet';

vi.mock('../services/wallet', () => ({
  getBalances: vi.fn(),
  getLedger: vi.fn(),
}));

import { getBalances, getLedger } from '../services/wallet';

describe('Wallet', () => {
  test('displays all three currency balances fetched from the API', async () => {
    vi.mocked(getBalances).mockResolvedValue([
      { currencyId: 1, currencyName: 'Campaign Credits', module: 'CAMPAIGN', balanceInCredits: 250 },
      { currencyId: 2, currencyName: 'Report Credits', module: 'REPORT', balanceInCredits: 40 },
      { currencyId: 3, currencyName: 'Discovery Credits', module: 'DISCOVERY', balanceInCredits: 0 },
    ]);
    vi.mocked(getLedger).mockResolvedValue({ entries: [], page: 1, pageSize: 20, totalCount: 0 });

    renderWithProviders(<Wallet />, '/wallet');

    await waitFor(() => expect(screen.getByText(/campaign credits: 250 credits/i)).toBeInTheDocument());
    expect(screen.getByText(/report credits: 40 credits/i)).toBeInTheDocument();
    expect(screen.getByText(/discovery credits: 0 credits/i)).toBeInTheDocument();
  });
});
