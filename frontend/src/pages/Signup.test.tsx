import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../test/renderWithProviders';
import Signup from './Signup';

vi.mock('../services/auth', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

import { login, signup } from '../services/auth';

describe('Signup', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(login).mockReset();
    vi.mocked(signup).mockReset();
  });

  test('creates an account, logs in, and redirects to the wallet', async () => {
    vi.mocked(signup).mockResolvedValue({ user: { id: 2, email: 'bob@example.com' } });
    vi.mocked(login).mockResolvedValue({
      token: 'fresh-token',
      user: { id: 2, email: 'bob@example.com' },
    });

    renderWithProviders(
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/wallet" element={<div>Wallet Page</div>} />
      </Routes>,
      '/signup',
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'bob@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'correcthorse');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(screen.getByText('Wallet Page')).toBeInTheDocument());
    expect(signup).toHaveBeenCalledWith('bob@example.com', 'correcthorse');
    expect(login).toHaveBeenCalledWith('bob@example.com', 'correcthorse');
    expect(localStorage.getItem('token')).toBe('fresh-token');
  });

  test('shows an error when the email is already registered', async () => {
    vi.mocked(signup).mockRejectedValue(new Error('Email is already registered'));

    renderWithProviders(
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/wallet" element={<div>Wallet Page</div>} />
      </Routes>,
      '/signup',
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'bob@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'correcthorse');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.queryByText('Wallet Page')).not.toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
