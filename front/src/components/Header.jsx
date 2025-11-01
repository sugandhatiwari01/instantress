// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LinkedInLogin from './LinkedInLogin';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      padding: '1rem',
      background: '#f8f9fa',
      borderBottom: '1px solid #dee2e6',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: 1200,
      margin: '0 auto'
    }}>
      <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.5rem', textDecoration: 'none', color: '#333' }}>
        ResumeAI
      </Link>

      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/input">Build Resume</Link>
        <Link to="/about">About</Link>

        {user ? (
          <>
            <span>Welcome, {user.firstName}!</span>
            <button
              onClick={logout}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <LinkedInLogin />
        )}
      </nav>
    </header>
  );
};

export default Header;