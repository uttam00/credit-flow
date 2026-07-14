import { describe, test, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import Campaigns from './Campaigns';

vi.mock('../services/campaigns', () => ({
  listCampaigns: vi.fn(),
  createCampaign: vi.fn(),
  fundCampaign: vi.fn(),
}));

import { listCampaigns, fundCampaign } from '../services/campaigns';

describe('Campaigns', () => {
  test('shows the backend error message when funding fails for insufficient balance', async () => {
    vi.mocked(listCampaigns).mockResolvedValue([
      {
        id: 1,
        name: 'Test Campaign',
        currencyId: 1,
        fundedAmountInCredits: 0,
        status: 'CREATED',
        createdAt: new Date().toISOString(),
      },
    ]);
    // Mimics the shape of the real AxiosError the backend's 422 response
    // produces; axios.isAxiosError() only checks the isAxiosError marker.
    vi.mocked(fundCampaign).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Insufficient balance to fund campaign 1: requested 999, available 50' } },
    });

    renderWithProviders(<Campaigns />, '/campaigns');

    await waitFor(() => expect(screen.getByText('Test Campaign')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^fund$/i }));

    const dialog = screen.getByRole('dialog', { name: /fund campaign/i });
    await userEvent.clear(within(dialog).getByLabelText(/amount/i));
    await userEvent.type(within(dialog).getByLabelText(/amount/i), '999');
    await userEvent.click(within(dialog).getByRole('button', { name: /confirm/i }));

    await waitFor(() =>
      expect(within(dialog).getByRole('alert')).toHaveTextContent(/insufficient balance/i),
    );
  });
});
