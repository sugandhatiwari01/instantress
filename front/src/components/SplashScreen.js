// src/components/SplashScreen.js
import React, { useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import "./SplashScreen.css";

function SplashScreen() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    particles: {
      number: { value: 20 },
      color: { value: "#a67c52" },
      opacity: { value: 0.15 },
      size: { value: 3, random: true },
      move: { enable: true, speed: 0.4, random: true },
      links: {
        enable: true,
        distance: 130,
        color: "#a67c52",
        opacity: 0.1,
        width: 0.5,
      },
    },
    detectRetina: true,
  };

  return (
    <div className="splash-root">
      <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />

      {/* Header */}
      <header className="main-header">
        <div className="brand">Seed</div>
        <div className="nav-buttons">
          <NavLink to="/input" className="nav-btn brown-btn">🏗 Build Resume</NavLink>
          <NavLink to="/about" className="nav-btn light-btn">📖 About</NavLink>
          <a
            href="https://www.linkedin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-btn outline-btn"
          >
            🔗 Sign in with LinkedIn
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-wrapper">
        <div className="hero-content">
          <h1 className="hero-title">
            Build Your Future With  
            <span className="highlight"> Elegant Simplicity</span>
          </h1>
          <p className="hero-subtext">
            Create resumes and portfolios that feel personal and polished  designed to tell your story with timeless beauty.
          </p>
          <div className="hero-actions">
            <Link to="/input" className="btn-primary">Get Started</Link>
            <Link to="/about" className="btn-outline">Learn More</Link>
          </div>
        </div>

        <div className="hero-image">
          <div className="card">
            <h3>Timeless Design</h3>
            <p>Layouts that highlight your strengths effortlessly.</p>
          </div>
          <div className="card card-secondary">
            <h3>Portfolio Ready</h3>
            <p>Showcase your work with grace and clarity.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>📧 Contact Us</p>
        <a href="mailto:contact.resumeai@gmail.com" className="mail-link">
          contact.resumeai@gmail.com
        </a>
      </footer>
    </div>
  );
}

export default SplashScreen;
