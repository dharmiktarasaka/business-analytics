import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { IUser } from '../types/index.js';

interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  mobileNumber: string;
  yearlyRevenue: string;
  displayName?: string;
  businessName?: string;
}

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginAsGuestDev: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUserStr = localStorage.getItem('stratiq_user');
      const token = localStorage.getItem('auth_token');

      if (token && savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          setUser(parsed);
          api.setToken(token, parsed);

          // Refresh user profile in background
          api.getMe()
            .then((res) => {
              if (res.user) {
                setUser(res.user);
                localStorage.setItem('stratiq_user', JSON.stringify(res.user));
              }
            })
            .catch(() => {
              // keep local session if server is offline
            });
        } catch {
          localStorage.removeItem('stratiq_user');
          localStorage.removeItem('auth_token');
          api.setToken(null, null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const res = await api.register(payload);
      api.setToken(res.token, res.user);
      localStorage.setItem('stratiq_user', JSON.stringify(res.user));
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      api.setToken(res.token, res.user);
      localStorage.setItem('stratiq_user', JSON.stringify(res.user));
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuestDev = () => {
    const guestUser: IUser = {
      uid: 'dev_executive_101',
      email: 'alex.morgan@advisory.io',
      displayName: 'Alex Morgan',
      mobileNumber: '+1 555-0199',
      yearlyRevenue: '$500,000 - $1,000,000'
    };
    const token = 'dev_token_guest_101';
    localStorage.setItem('stratiq_user', JSON.stringify(guestUser));
    localStorage.setItem('auth_token', token);
    api.setToken(token, guestUser);
    setUser(guestUser);
  };

  const logout = () => {
    localStorage.removeItem('stratiq_user');
    localStorage.removeItem('auth_token');
    api.setToken(null, null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        loginAsGuestDev,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
