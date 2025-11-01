// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Create the context
const AuthContext = createContext();

// 2. Hook that consumes it
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

// 3. Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem('linkedinUser');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setAccessToken(parsed.accessToken);
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('linkedinUser', JSON.stringify(userData));
    setUser(userData);
    setAccessToken(userData.accessToken);
  };

  const logout = () => {
    localStorage.removeItem('linkedinUser');
    setUser(null);
    setAccessToken(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};