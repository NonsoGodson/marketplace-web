'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, ApiError } from './api-client';
import { getTokens, setTokens, clearTokens } from './token-store';
import { decodeAccessToken, DecodedAccessToken } from './jwt';

interface AuthState {
  user: DecodedAccessToken | null; // See README: only id/email/role are available until
  // the backend gets a GET /users/me endpoint to return the full profile.
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: 'BUYER' | 'SELLER' }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  // Restore session from storage on first load.
  useEffect(() => {
    const stored = getTokens();
    const user = stored ? decodeAccessToken(stored.accessToken) : null;
    setState({ user, loading: false });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.auth.login({ email, password });
    setTokens(tokens);
    setState({ user: decodeAccessToken(tokens.accessToken), loading: false });
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; firstName: string; lastName: string; role?: 'BUYER' | 'SELLER' }) => {
      const tokens = await api.auth.register(data);
      setTokens(tokens);
      setState({ user: decodeAccessToken(tokens.accessToken), loading: false });
    },
    [],
  );

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ApiError };
