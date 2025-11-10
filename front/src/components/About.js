// src/components/About.js
import React from "react";
import { Link } from "react-router-dom";
import "../App.css";
import "./About.css";

function About() {
  return (
    <div className="about-container">
      <div className="about-content">
        <h1 className="about-title">About ResumeAI</h1>
        <p className="about-text">
          ResumeAI is a refined web platform built to help you design
          professional, elegant, and visually appealing resumes and portfolios.
          It simplifies your creation process while maintaining a timeless aesthetic,
          allowing you to focus on what truly matters — your story, your skills, and your growth.
        </p>

        <p className="about-text">
          Designed with a clean and classic brown-beige interface, it combines functionality
          with sophistication — giving your profile the polished edge it deserves.
        </p>

        <Link to="/" className="about-btn">← Back to Home</Link>
      </div>
    </div>
  );
}

export default About;
