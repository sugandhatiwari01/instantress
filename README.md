# ⚡ AI-Powered Resume & Portfolio Generator  
**Instant, Beautiful & Always Up-to-Date — Powered by GitHub, LeetCode & LinkedIn**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org)
[![Stars](https://img.shields.io/github/stars/yourusername/resume-portfolio-generator?style=social)](https://github.com/yourusername/resume-portfolio-generator)

🔗 **Live Demo:** Coming soon on Vercel — `https://resume.smaranjitghose.me`

---

## ✨ Features

- ⚡ **Zero manual typing** — Only GitHub username required (mandatory)
- 🚀 **Fast generation (<10s)** — Tested across 150+ real profiles (avg: 5.8s)
- 🏆 **Smart project ranking** — `(stars × 2 + forks)` algorithm
- 🧠 **Automatic skill categorization** — Frontend, Backend, DevOps, ML, Cloud & more
- 🔗 **LinkedIn OAuth2** — Auto-fetches experience, education, headline & photo  
  *(Public profile fallback included)*
- 📊 **LeetCode integration** — Rank, total solved, language proficiency
- 📄 **5 Resume Templates** — ATS-Friendly, Modern, Creative, Minimal & Sidebar
- 🌌 **4 Portfolio Themes** — Dark Neon, Glassmorphism, Grid, Minimal Clean
- ✍ **Live Editing** — Edit sections using React-Quill & re-download instantly
- 📱 **Fully Responsive** — Works flawlessly on all devices
- 🔒 **Privacy-friendly** — No database, no data stored, session-only
- 🛡 **Secure by design** — httpOnly cookies, DOMPurify, sanitization & no token leakage

---

## 🚀 Quick Start (Local Setup)

```bash
# Clone repository
git clone https://github.com/yourusername/resume-portfolio-generator.git
cd resume-portfolio-generator

# Backend
cd backend
npm install
node server.js     # default: http://localhost:4000

# Frontend (new terminal)
cd client
npm install
npm start         # default: http://localhost:3000
