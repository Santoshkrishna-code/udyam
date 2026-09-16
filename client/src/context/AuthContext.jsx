import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('udyam_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user on token load
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Session expired or invalid:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem('udyam_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const quickLogin = async (role) => {
    const creds =
      role === 'ADMIN'
        ? { email: 'admin@udyam.local', password: 'admin123' }
        : { email: 'sales@udyam.local', password: 'sales123' };
    return login(creds.email, creds.password);
  };

  const logout = () => {
    localStorage.removeItem('udyam_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    quickLogin,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isSales: user?.role === 'SALES_USER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
