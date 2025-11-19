// animatedAesthetic.js
module.exports = (data = {}) => {
  const {
    githubUsername = "AestheticDev",
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
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(githubUsername)} — Portfolio</title>

<style>
  :root {
    --bg: #0a0c10;
    --card: rgba(255, 255, 255, 0.08);
    --border: rgba(255, 255, 255, 0.14);
    --text: #f0f4ff;
    --muted: #9ba3b8;
    --accent: #a78bfa;
    --accent2: #7dd3fc;
  }

  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
  }

  .blob {
    position: fixed;
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, var(--accent2), transparent 60%);
    filter: blur(80px);
    animation: float 12s infinite ease-in-out;
    opacity: 0.35;
    z-index: -1;
  }
  .blob:nth-child(2) {
    left: 60%;
    top: 20%;
    background: radial-gradient(circle, var(--accent), transparent 60%);
    animation-duration: 18s;
  }
  @keyframes float {
    0% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-120px) translateX(80px); }
    100% { transform: translateY(0px) translateX(0px); }
  }

  .wrap {
    max-width: 1050px;
    margin: auto;
    padding: 40px 20px;
    animation: fadeIn 1s ease forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .header {
    text-align: center;
    margin-bottom: 45px;
  }
  .header h1 {
    font-size: 40px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    color: transparent;
    margin: 0;
  }

  .glass {
    background: var(--card);
    padding: 24px;
    border-radius: 16px;
    border: 1px solid var(--border);
    box-shadow: 0 8px 40px rgba(0,0,0,0.35);
    margin-bottom: 28px;
    backdrop-filter: blur(16px);
  }

  h2 {
    margin-top: 0;
    font-size: 22px;
    color: var(--accent2);
    letter-spacing: 0.4px;
  }

  .skill-item, .exp-item, .proj-item {
    margin-bottom: 14px;
  }

  .proj-name {
    font-weight: 600;
    color: var(--accent);
  }

  a {
    color: var(--accent2);
  }

  hr {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.08);
    margin: 20px 0;
  }
</style>
</head>

<body>

<div class="blob"></div>
<div class="blob"></div>

<div class="wrap">
  <div class="header">
    <h1>${esc(githubUsername)}</h1>
  </div>

  ${
    summary
      ? `<div class="glass">
           <h2>About Me</h2>
           <p>${esc(summary)}</p>
         </div>`
      : ""
  }

  ${
    Object.keys(categorizedSkills).length
      ? `<div class="glass">
          <h2>Skills</h2>
          ${Object.entries(categorizedSkills)
            .map(
              ([k, v]) =>
                `<div class="skill-item"><strong>${esc(k)}:</strong> ${v
                  .map(esc)
                  .join(", ")}</div>`
            )
            .join("")}
        </div>`
      : ""
  }

  ${
    bestProjects?.length
      ? `<div class="glass">
          <h2>Projects</h2>
          ${bestProjects
            .map(
              (p) =>
                `<div class="proj-item">
                  <div class="proj-name">${esc(p.name || "Project")}</div>
                  <div>${esc(p.description || "")}</div>
                  ${
                    p.html_url || p.url
                      ? `<div><a href="${esc(
                          p.html_url || p.url
                        )}" target="_blank">View Project →</a></div>`
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
      ? `<div class="glass">
          <h2>Experience</h2>
          ${workExperience
            .map(
              (e) =>
                `<div class="exp-item">
                  <strong>${esc(e.title || "")}</strong> — ${esc(e.company || "")}
                  <div style="color:var(--muted); font-size:14px">${esc(e.dates || "")}</div>
                  <div>${esc(e.description || "")}</div>
                </div>`
            )
            .join("")}
        </div>`
      : ""
  }

  ${
    education
      ? `<div class="glass">
           <h2>Education</h2>
           <p>${esc(education)}</p>
         </div>`
      : ""
  }

  <!-- CONTACT SECTION (UPDATED) -->
  <div class="glass">
    <h2>Contact</h2>
    <p>
      ${contactInfo.email ? `✉ ${esc(contactInfo.email)}<br><br>` : ""}

      <!-- GitHub link added -->
      🐙 <a href="https://github.com/${esc(githubUsername)}" target="_blank">
            GitHub → ${esc(githubUsername)}
          </a><br><br>

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
