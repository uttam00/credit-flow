import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import BuyCredits from './BuyCredits';

vi.mock('../services/currencies', () => ({
  getCurrencies: vi.fn(),
}));
vi.mock('../services/payment', () => ({
  buyCredits: vi.fn(),
}));

import { getCurrencies } from '../services/currencies';
import { buyCredits } from '../services/payment';

describe('BuyCredits', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  test('redirects the browser to the Stripe checkout URL returned by the backend', async () => {
    vi.mocked(getCurrencies).mockResolvedValue([
      {
        id: 1,
        name: 'Campaign Credits',
        module: 'CAMPAIGN',
        priceInPaise: 300,
        plans: [{ credits: 100, priceInPaise: 30000 }],
      },
    ]);
    vi.mocked(buyCredits).mockResolvedValue('https://checkout.stripe.com/c/pay/cs_test_fake');

    renderWithProviders(<BuyCredits />, '/buy');

    await waitFor(() => expect(screen.getByRole('heading', { name: /buy credits/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /proceed to stripe/i }));

    await waitFor(() =>
      expect(window.location.href).toBe('https://checkout.stripe.com/c/pay/cs_test_fake'),
    );
    expect(buyCredits).toHaveBeenCalledWith({ currencyId: 1, planIndex: 0 });
  });
});
