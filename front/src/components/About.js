// src/components/About.js
import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

function About() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>About Us</h1>
      </header>
      <main className="main-content">
        <p>
          Instant Resume & Portfolio Generator is an AI-powered tool designed to help you create
          professional resumes and portfolios effortlessly. Built with the MERN stack, it leverages
          GitHub and LeetCode data to showcase your skills and projects in a futuristic, neon-themed interface.
        </p>
        <Link to="/" className="add-btn">Back to Home</Link>
      </main>
    </div>
  );
}

export default About;