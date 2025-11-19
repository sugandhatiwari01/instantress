// flowWave.js
module.exports = (data = {}) => {
  const {
    githubUsername = "FlowDev",
    summary = "",
    categorizedSkills = {},
    bestProjects = [],
    workExperience = [],
    education = "",
    contactInfo = {},
  } = data;

  const esc = (s) =>
    typeof s === "string"
      ? s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]))
      : s ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(githubUsername)} — Portfolio</title>

<style>
  :root {
    --bg: #f7f2fc;
    --card: rgba(255, 255, 255, 0.65);
    --text: #2a2344;
    --muted: #6b6280;
    --accent: #b388ff;
    --accent2: #7dd3fc;
    --shadow: 0 8px 35px rgba(72, 0, 120, 0.15);
  }

  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
  }

  /* Decorative flowing gradient wave */
  .wave {
    position: fixed;
    top: -120px;
    left: -200px;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle at 30% 30%, var(--accent), transparent 60%);
    filter: blur(90px);
    opacity: 0.35;
    animation: drift 14s infinite linear;
    z-index: -2;
  }
  .wave:nth-child(2) {
    top: auto;
    bottom: -180px;
    right: -180px;
    background: radial-gradient(circle at 50% 50%, var(--accent2), transparent 65%);
    animation-duration: 20s;
  }

  @keyframes drift {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(25deg) scale(1.15); }
    100% { transform: rotate(0deg) scale(1); }
  }

  .wrap {
    max-width: 1050px;
    margin: auto;
    padding: 60px 22px;
  }

  .header {
    text-align: center;
    margin-bottom: 60px;
    animation: fadeUp 1s ease-out forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .header h1 {
    font-size: 42px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    color: transparent;
    margin: 0;
  }

  .tag {
    margin-top: 10px;
    color: var(--muted);
    font-size: 17px;
  }

  .section {
    background: var(--card);
    border-radius: 22px;
    padding: 28px;
    margin-bottom: 32px;
    backdrop-filter: blur(18px);
    box-shadow: var(--shadow);
    animation: fadeUp 1.2s ease-out forwards;
  }

  h2 {
    margin: 0 0 14px 0;
    font-size: 24px;
    color: var(--accent);
    letter-spacing: 0.4px;
  }

  .item {
    margin-bottom: 14px;
    line-height: 1.7;
  }

  .project-title {
    font-weight: 600;
    font-size: 17px;
    color: var(--accent2);
  }

  a {
    color: var(--accent2);
    font-weight: 600;
  }

  .muted {
    color: var(--muted);
  }

  hr {
    border: none;
    border-top: 1px solid rgba(120, 120, 150, 0.15);
    margin: 22px 0;
  }

</style>
</head>

<body>

<div class="wave"></div>
<div class="wave"></div>

<div class="wrap">

  <!-- HEADER -->
  <div class="header">
    <h1>${esc(githubUsername)}</h1>
    <div class="tag">A flowing portfolio created with clean design ✦</div>
  </div>

  <!-- SUMMARY -->
  ${
    summary
      ? `<div class="section">
          <h2>About Me</h2>
          <p>${esc(summary)}</p>
        </div>`
      : ""
  }

  <!-- SKILLS -->
  ${
    Object.keys(categorizedSkills).length
      ? `<div class="section">
          <h2>Skills</h2>
          ${Object.entries(categorizedSkills)
            .map(
              ([k, v]) =>
                `<div class="item"><strong>${esc(k)}:</strong> ${v.map(esc).join(", ")}</div>`
            )
            .join("")}
        </div>`
      : ""
  }

  <!-- PROJECTS -->
  ${
    bestProjects?.length
      ? `<div class="section">
          <h2>Projects</h2>
          ${bestProjects
            .map(
              (p) =>
                `<div class="item">
                  <div class="project-title">${esc(p.name || "Project")}</div>
                  <div class="muted">${esc(p.description || "")}</div>
                  ${
                    p.html_url || p.url
                      ? `<div><a href="${esc(p.html_url || p.url)}" target="_blank">Visit →</a></div>`
                      : ""
                  }
                </div>`
            )
            .join("")}
        </div>`
      : ""
  }

  <!-- EXPERIENCE -->
  ${
    workExperience?.length
      ? `<div class="section">
          <h2>Experience</h2>
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

  <!-- EDUCATION -->
  ${
    education
      ? `<div class="section">
          <h2>Education</h2>
          <p>${esc(education)}</p>
        </div>`
      : ""
  }

  <!-- CONTACT -->
  <div class="section">
    <h2>Contact</h2>
    <p>
      ${contactInfo.email ? `✉ ${esc(contactInfo.email)}<br>` : ""}
      ${contactInfo.mobile ? `☎ ${esc(contactInfo.mobile)}<br>` : ""}
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
