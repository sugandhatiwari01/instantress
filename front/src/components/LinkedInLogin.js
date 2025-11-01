// src/components/LinkedInLogin.jsx
import React from 'react';
import './LinkedInLogin.css';

const LinkedInLogin = () => {
  const handleLinkedInLogin = () => {
    window.location.href = 'http://localhost:4000/auth/linkedin';
  };

  return (
    <div className="linkedin-login">
      <button onClick={handleLinkedInLogin} className="linkedin-button">
        <img
          src="https://content.linkedin.com/content/dam/developer/global/en_US/site/img/signin-button.png"
          alt="Sign in with LinkedIn"
          height="41"
          width="215"
        />
      </button>
    </div>
  );
};

export default LinkedInLogin;