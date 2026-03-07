import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (storedUser && storedToken) {
        // Start with stored user for instant render
        setUser(JSON.parse(storedUser));
        try {
          // Re-fetch from backend to get fresh data like captainName
          const response = await api.get('/user/me');
          if (response.data) {
            setUser(response.data);
            if (localStorage.getItem('user')) {
              localStorage.setItem('user', JSON.stringify(response.data));
            } else {
              sessionStorage.setItem('user', JSON.stringify(response.data));
            }
          }
        } catch (err) {
          console.error("Failed to re-fetch user on load:", err);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = { ...response.data };
      const token = userData.token;

      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('token', token);
      }

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login failed", error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (registrationData) => {
    try {
      await api.post('/auth/register', registrationData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const registerCaptain = async (formData) => {
    try {
      await api.post('/auth/register-captain', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Captain registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);

    // Update local/session storage
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else if (sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    login,
    register,
    registerCaptain,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
