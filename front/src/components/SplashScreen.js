// src/components/SplashScreen.js
import React, { useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { TypeAnimation } from "react-type-animation";
import "./SplashScreen.css";

function SplashScreen() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const particlesOptions = {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 1000 } },
      color: { value: "#9d00ff" }, // Neon purple particles
      shape: { type: "circle" },
      opacity: { value: 0.6, random: true },
      size: { value: 4, random: true },
      move: {
        enable: true,
        speed: 1.5,
        direction: "none",
        random: true,
        out_mode: "out",
      },
      links: {
        enable: true,
        distance: 120,
        color: "#ff007a", // Neon pink links
        opacity: 0.5,
        width: 1,
      },
    },
    interactivity: {
      events: {
        onhover: { enable: true, mode: "connect" },
        onclick: { enable: true, mode: "push" },
      },
      modes: {
        connect: { distance: 100 },
        push: { quantity: 3 },
      },
    },
    detectRetina: true,
  };

  return (
    <div className="splash-container">
      <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />
      <nav className="splash-nav">
        <ul className="nav-links">
          <li><NavLink to="/" end className={({ isActive }) => isActive ? "nav-active" : ""}>Home</NavLink></li>
          <li><NavLink to="/about" className={({ isActive }) => isActive ? "nav-active" : ""}>About</NavLink></li>
          <li><NavLink to="/contact" className={({ isActive }) => isActive ? "nav-active" : ""}>Contact</NavLink></li>
        </ul>
      </nav>
      <div className="splash-content">
        <TypeAnimation
          sequence={[
            "Welcome to Instant Resume & Portfolio Generator",
            1000,
            "Craft Professional Resumes with AI",
            1000,
            "Showcase Your Portfolio in Style",
            1000,
          ]}
          wrapper="h1"
          speed={50}
          className="splash-title"
          repeat={Infinity}
        />
        <p className="splash-subtitle">
          Powered by AI - Create stunning resumes and portfolios with a neon touch!
        </p>
        <Link to="/input" className="splash-btn">Get Started</Link>
      </div>
      <footer className="splash-footer">
        <p>Connect with us:</p>
        <div className="social-links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <i className="fab fa-github"></i>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <i className="fab fa-linkedin"></i>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default SplashScreen;