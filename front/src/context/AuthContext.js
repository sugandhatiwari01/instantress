// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('linkedinUser');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setAccessToken(parsed.accessToken);
    }
    setLoading(false);
  }, []);

  // LOGIN: Save full LinkedIn user including pictureUrl
  const login = (userData) => {
    const fullUser = {
      ...userData,
      pictureUrl: userData.pictureUrl || null,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      fullName: userData.fullName || '',
      email: userData.email || '',
      profileUrl: userData.profileUrl || '',
      headline: userData.headline || '',
    };

    localStorage.setItem('linkedinUser', JSON.stringify(fullUser));
    setUser(fullUser);
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