// cyberGrid.js
module.exports = (data = {}) => {
  const {
    githubUsername = "NeoCoder",
    summary = "",
    categorizedSkills = {},
    bestProjects = [],
    workExperience = [],
    education = "",
    contactInfo = {},
  } = data;

  const esc = (s) =>
    typeof s === "string"
      ? s.replace(/[&<>"']/g, (m) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m]))
      : s ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(githubUsername)} — Cyber Grid Portfolio</title>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&family=Inter:wght@300;400;600&display=swap');

  :root {
    --bg: #03010f;
    --grid: rgba(0, 255, 255, 0.1);
    --card: rgba(0, 0, 0, 0.35);
    --text: #c8f8ff;
    --muted: #78b2c8;
    --neon: #00f2ff;
    --neon2: #ff00e6;
    --shadow: 0 0 25px rgba(0, 255, 255, 0.35);
  }

  body {
    margin: 0;
    background: var(--bg);
    font-family: 'Inter', sans-serif;
    color: var(--text);
    overflow-x: hidden;
  }

  .grid-lines {
    background-image:
      linear-gradient(var(--grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid) 1px, transparent 1px);
    background-size: 60px 60px;
    position: fixed;
    inset: 0;
    z-index: -10;
    animation: scan 18s linear infinite;
  }
  @keyframes scan { 
    0% { background-position: 0 0; }
    100% { background-position: 120px 120px; }
  }

  .glow {
    position: fixed;
    bottom: -140px;
    left: 0;
    width: 100%;
    height: 240px;
    background: radial-gradient(circle at center, var(--neon2), transparent 70%);
    opacity: 0.4;
    filter: blur(80px);
    z-index: -9;
  }

  .wrap {
    max-width: 1050px;
    margin: auto;
    padding: 60px 24px;
  }

  .header {
    text-align: center;
    margin-bottom: 60px;
    animation: rise 1.2s ease-out forwards;
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(25px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .header h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 44px;
    text-shadow: 0 0 20px var(--neon);
    color: var(--neon);
    margin: 0;
  }

  .section {
    background: var(--card);
    border: 1px solid rgba(0, 255, 255, 0.25);
    border-radius: 14px;
    padding: 26px;
    margin-bottom: 32px;
    box-shadow: var(--shadow);
    backdrop-filter: blur(10px);
  }

  h2 {
    font-family: 'Orbitron', sans-serif;
    font-size: 24px;
    margin: 0 0 16px 0;
    color: var(--neon);
  }

  .item {
    margin-bottom: 12px;
    line-height: 1.7;
  }

  .project-title {
    font-weight: 600;
    font-size: 17px;
    color: var(--neon2);
  }

  a {
    color: var(--neon);
    text-decoration: none;
  }

  .muted {
    color: var(--muted);
  }
</style>
</head>

<body>

<div class="grid-lines"></div>
<div class="glow"></div>

<div class="wrap">

  <div class="header">
    <h1>${esc(githubUsername)}</h1>
  </div>

  ${
    summary
      ? `<div class="section">
          <h2>INTRO</h2>
          <p>${esc(summary)}</p>
        </div>`
      : ""
  }

  ${
    Object.keys(categorizedSkills).length
      ? `<div class="section">
          <h2>CORE SYSTEM SKILLS</h2>
          ${Object.entries(categorizedSkills)
            .map(
              ([k, v]) =>
                `<div class="item"><strong>${esc(k)}:</strong> ${v.map(esc).join(", ")}</div>`
            )
            .join("")}
        </div>`
      : ""
  }

  ${
    bestProjects?.length
      ? `<div class="section">
          <h2>PROJECT MODULES</h2>
          ${bestProjects
            .map(
              (p) =>
                `<div class="item">
                  <div class="project-title">${esc(p.name || "Project")}</div>
                  <div class="muted">${esc(p.description || "")}</div>
                  ${
                    p.html_url || p.url
                      ? `<div><a href="${esc(p.html_url || p.url)}" target="_blank">LAUNCH →</a></div>`
                      : ""
                  }
                </div>`
            )
            .join("")}
        </div>`
      : ""
  }

  ${
    workExperience?.length
      ? `<div class="section">
          <h2>PROFESSIONAL LOGS</h2>
          ${workExperience
            .map(
              (e) =>
                `<div class="item">
                  <strong>${esc(e.title || "")}</strong> — ${esc(e.company || "")}
                  <div class="muted">${esc(e.dates || "")}</div>
                  <div>${esc(e.description || "")}</div>
                </div>`
            )
            .join("")}
        </div>`
      : ""
  }

  ${
    education
      ? `<div class="section">
          <h2>TRAINING / EDUCATION</h2>
          <p>${esc(education)}</p>
        </div>`
      : ""
  }

  <!-- CONTACT -->
  <div class="section">
    <h2>CONTACT NODE</h2>
    <p>
      ${contactInfo.email ? `✉ ${esc(contactInfo.email)}<br>` : ""}

      <!-- REMOVED PHONE NUMBER -->

      🐙 <a href="https://github.com/${esc(githubUsername)}" target="_blank">
          GitHub Profile
      </a><br>

      ${
        contactInfo.linkedin
          ? `🔗 <a href="${esc(contactInfo.linkedin)}" target="_blank">LinkedIn</a>`
          : ""
      }
    </p>
  </div>

</div>

</body>
</html>`;
};
