import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import api from '../api/client';

const getLocalItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignore error in non-browser or mock environments
  }
  return null;
};

export const DEFAULT_LOCAL_USER: User = {
  id: 'local-user',
  email: 'local@device',
  defaultCurrency: getLocalItem('runway_default_currency') || 'INR',
  monthlyIncome: getLocalItem('runway_monthly_income')
    ? parseFloat(getLocalItem('runway_monthly_income')!)
    : null,
};

interface AuthContextType {
  user: User;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(DEFAULT_LOCAL_USER);
  const [token, setToken] = useState<string | null>(localStorage.getItem('runway_access_token'));
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get<User>('/auth/me');
          setUser(res.data);
        } catch {
          // If silent check fails or backend offline, keep local user state
        }
      }
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      setToken(res.data.accessToken);
      setUser(res.data.user);
      localStorage.setItem('runway_access_token', res.data.accessToken);
    } catch (e) {
      console.error('Login error', e);
      throw e;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const res = await api.post<AuthResponse>('/auth/signup', { email, password });
      setToken(res.data.accessToken);
      setUser(res.data.user);
      localStorage.setItem('runway_access_token', res.data.accessToken);
    } catch (e) {
      console.error('Signup error', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore offline logout errors
    } finally {
      setToken(null);
      setUser(DEFAULT_LOCAL_USER);
      localStorage.removeItem('runway_access_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
