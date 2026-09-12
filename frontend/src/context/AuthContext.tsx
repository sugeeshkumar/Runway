import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import api from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('runway_access_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Attempt to fetch profile using current Bearer access token
          const res = await api.get<User>('/auth/me');
          setUser(res.data);
        } catch {
          // If /auth/me fails (e.g. token expired), attempt token refresh
          try {
            const refreshRes = await api.post<AuthResponse>('/auth/refresh');
            setToken(refreshRes.data.accessToken);
            localStorage.setItem('runway_access_token', refreshRes.data.accessToken);
            setUser(refreshRes.data.user);
          } catch {
            setToken(null);
            setUser(null);
            localStorage.removeItem('runway_access_token');
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    setToken(res.data.accessToken);
    setUser(res.data.user);
    localStorage.setItem('runway_access_token', res.data.accessToken);
  };

  const signup = async (email: string, password: string) => {
    const res = await api.post<AuthResponse>('/auth/signup', { email, password });
    setToken(res.data.accessToken);
    setUser(res.data.user);
    localStorage.setItem('runway_access_token', res.data.accessToken);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      setToken(null);
      setUser(null);
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
