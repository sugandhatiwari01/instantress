// src/components/Contact.js
import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

function Contact() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Contact Us</h1>
      </header>
      <main className="main-content">
        <p>
          Have questions or feedback? Reach out to us at <a href="mailto:support@example.com">support@example.com</a>.
          Follow us on GitHub and LinkedIn for updates!
        </p>
        <Link to="/" className="add-btn">Back to Home</Link>
      </main>
    </div>
  );
}

export default Contact;