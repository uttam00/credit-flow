import { describe, test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../test/renderWithProviders';
import Login from './Login';

vi.mock('../services/auth', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

import { login } from '../services/auth';

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(login).mockReset();
  });

  test('logs in and redirects to the wallet', async () => {
    vi.mocked(login).mockResolvedValue({
      token: 'test-token',
      user: { id: 1, email: 'alice@example.com' },
    });

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/wallet" element={<div>Wallet Page</div>} />
      </Routes>,
      '/login',
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'correcthorse');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByText('Wallet Page')).toBeInTheDocument());
    expect(login).toHaveBeenCalledWith('alice@example.com', 'correcthorse');
    expect(localStorage.getItem('token')).toBe('test-token');
  });

  test('shows an error on invalid credentials without navigating', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Invalid email or password'));

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/wallet" element={<div>Wallet Page</div>} />
      </Routes>,
      '/login',
    );

    await userEvent.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i));
    expect(screen.queryByText('Wallet Page')).not.toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
