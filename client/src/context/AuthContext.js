import React, { createContext, useState, useCallback, useEffect } from 'react';
import { setAuthToken as setAPIAuthToken, authAPI } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Single initialization effect - runs once on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          // Set token in API client first
          setAPIAuthToken(storedToken);
          // Then verify it's valid
          const response = await authAPI.getCurrentUser();
          if (response.data?.success === true && response.data?.user) {
            setToken(storedToken);
            setUser(response.data.user);
          } else {
            // Invalid token response - clear it
            localStorage.removeItem('token');
            setAPIAuthToken(null);
          }
        }
      } catch (error) {
        // Token invalid or network error
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setAPIAuthToken(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const register = useCallback(async (name, email, password, role, firm = null, licenseNumber = null) => {
    try {
      const response = await authAPI.register({
        name,
        email,
        password,
        role,
        ...(firm && { firm }),
        ...(licenseNumber && { licenseNumber })
      });

      if (response.data?.success === true && response.data?.token) {
        const newToken = response.data.token;
        const newUser = response.data.user;

        localStorage.setItem('token', newToken);
        setAPIAuthToken(newToken);
        setToken(newToken);
        setUser(newUser);

        return { success: true, user: newUser };
      }
      return { success: false, error: 'Invalid server response' };
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Registration failed';
      return { success: false, error: msg };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login({
        email,
        password
      });

      if (response.data?.success === true && response.data?.token) {
        const newToken = response.data.token;
        const newUser = response.data.user;

        localStorage.setItem('token', newToken);
        setAPIAuthToken(newToken);
        setToken(newToken);
        setUser(newUser);

        return { success: true, user: newUser };
      }
      return { success: false, error: 'Invalid server response' };
    } catch (error) {
      const msg = error.response?.data?.error || error.message || 'Login failed';
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAPIAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      const response = await authAPI.updateProfile(updates);
      if (response.data?.success === true && response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: 'Update failed' };
    } catch (error) {
      const msg = error.response?.data?.error || 'Update failed';
      return { success: false, error: msg };
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
