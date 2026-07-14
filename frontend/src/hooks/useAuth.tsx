import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../services/auth';
import type { AuthUser } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// api.ts runs outside the React tree (axios interceptors aren't
// components), so on a 401 it can't call useAuth().logout() directly. This
// bridge lets it trigger the real logout anyway — client-side navigation
// via React Router, not a hard window.location reload, so anything else
// mounted at the root (like toasts) survives the transition.
let externalLogout: (() => void) | null = null;

export function triggerGlobalLogout(): void {
  externalLogout?.();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const navigate = useNavigate();

  async function login(email: string, password: string): Promise<void> {
    const { token: newToken, user: newUser } = await authApi.login(email, password);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    navigate('/wallet');
  }

  async function signup(email: string, password: string): Promise<void> {
    await authApi.signup(email, password);
    // The signup endpoint only creates the account; log in immediately so
    // signup itself ends with a stored token and a redirect to the wallet.
    await login(email, password);
  }

  const logout = useCallback((): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    externalLogout = logout;
    return () => {
      externalLogout = null;
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
