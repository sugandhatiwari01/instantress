module.exports = (data = {}) => {
  const {
    githubUsername = "OceanDev",
    summary = "",
    categorizedSkills = {},
    bestProjects = [],
    workExperience = [],
    education = {},
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

  const has = {
    summary: !!summary,
    skills: Object.keys(categorizedSkills).length > 0,
    projects: bestProjects.length > 0,
    experience: workExperience.length > 0,
    education:
      typeof education === "string"
        ? education.trim().length > 0
        : !!(
            education.degree ||
            education.institution ||
            education.year ||
            education.content
          ),
    contact: contactInfo.email || contactInfo.linkedin || githubUsername,
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(githubUsername)} — Glass Ocean Portfolio</title>

<style>
:root {
  --bg: linear-gradient(180deg, #001f3f, #003a6b, #005f8f);
  --glass-bg: rgba(255, 255, 255, 0.09);
  --glass-border: rgba(255, 255, 255, 0.20);
  --text: #e6faff;
  --muted: #a8d8ff;
  --accent: #4ae3ff;
}

body {
  margin: 0;
  font-family: "Inter", sans-serif;
  color: var(--text);
  background: var(--bg);
  background-attachment: fixed;
  overflow-x: hidden;
}

/* SIDEBAR */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 210px;
  background: rgba(0, 40, 70, 0.5);
  backdrop-filter: blur(18px);
  border-right: 1px solid rgba(255,255,255,0.12);
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.logo {
  font-size: 30px;
  font-weight: 800;
  background: linear-gradient(90deg, #4ae3ff, #89faff);
  -webkit-background-clip: text;
  color: transparent;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}
.nav-links a {
  color: var(--muted);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
}
.nav-links a:hover { color: var(--accent); }

/* MAIN CONTENT */
.main {
  margin-left: 240px;
  padding: 40px 32px;
}

/* WAVE HEADER */
.wave-header {
  background: linear-gradient(135deg, rgba(0,150,200,0.4), rgba(0,215,255,0.25));
  padding: 50px;
  margin-bottom: 40px;
  border-radius: 28px;
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 10px 32px rgba(0,0,0,0.25);
}
.wave-header h1 {
  margin: 0;
  font-size: 44px;
  font-weight: 800;
  color: white;
}
.wave-header p {
  color: var(--muted);
  font-size: 17px;
}

/* GLASS CARDS */
.card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px);
  padding: 22px;
  margin-bottom: 28px;
  border-radius: 20px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.22);
}

.card h2 {
  margin: 0 0 14px 0;
  font-size: 24px;
  color: var(--accent);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(260px,1fr));
  gap: 16px;
}

.project {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  padding: 16px;
  border-radius: 16px;
}
.project h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}
.meta {
  font-size: 13px;
  margin-top: 6px;
  color: var(--muted);
}

.chip {
  display: inline-block;
  padding: 4px 9px;
  background: rgba(255,255,255,0.18);
  border-radius: 999px;
  margin-right: 6px;
}

footer a {
  color: var(--accent);
  text-decoration: none;
}
footer a:hover { color: white; }
</style>
</head>

<body>

<div class="sidebar">
  <div class="logo">${esc(githubUsername)}</div>
  <div class="nav-links">
    <a href="#summary">Summary</a>
    ${has.projects ? `<a href="#projects">Projects</a>` : ""}
    ${has.skills ? `<a href="#skills">Skills</a>` : ""}
    ${has.experience ? `<a href="#experience">Experience</a>` : ""}
    ${has.education ? `<a href="#education">Education</a>` : ""}
    ${has.contact ? `<a href="#contact">Contact</a>` : ""}
  </div>
</div>

<div class="main">

  <!-- HEADER -->
  <div class="wave-header">
    <h1>${esc(githubUsername)}'s Portfolio</h1>
    <p>Diving deep into development — exploring waves of creativity.</p>
  </div>

  <!-- SUMMARY -->
  ${has.summary ? `
  <div class="card" id="summary">
    <h2>Summary</h2>
    <p>${esc(summary)}</p>
  </div>` : ""}

  <!-- PROJECTS -->
  ${has.projects ? `
  <div class="card" id="projects">
    <h2>Projects</h2>
    <div class="grid">
      ${bestProjects
        .map(
          (p) => `
        <div class="project">
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.description || "")}</p>
          <div class="meta">
            ${p.language ? `<span class="chip">${esc(p.language)}</span>` : ""}
            ${
              p.stargazers_count || p.stars
                ? `⭐ ${(p.stargazers_count || p.stars)}`
                : ""
            }
          </div>
        </div>`
        )
        .join("")}
    </div>
  </div>` : ""}

  <!-- SKILLS -->
  ${has.skills ? `
  <div class="card" id="skills">
    <h2>Skills</h2>
    ${Object.entries(categorizedSkills)
      .map(
        ([k, v]) => `
        <p><strong>${esc(k)}:</strong> ${v.map(esc).join(", ")}</p>`
      )
      .join("")}
  </div>` : ""}

  <!-- EXPERIENCE -->
  ${has.experience ? `
  <div class="card" id="experience">
    <h2>Experience</h2>
    ${workExperience
      .map(
        (e) => `
      <p>
        <strong>${esc(e.title)}</strong> — ${esc(e.company)}<br>
        <em>${esc(e.dates)}</em><br>
        ${esc(e.description || "")}
      </p>`
      )
      .join("")}
  </div>` : ""}

  <!-- EDUCATION -->
  ${has.education ? `
  <div class="card" id="education">
    <h2>Education</h2>
    ${
      typeof education === "string"
        ? esc(education).replace(/\n/g, "<br>")
        : `
      <p>
        <strong>${esc(education.degree)}</strong><br>
        ${esc(education.institution)}<br>
        ${esc(education.year || education.dates)}
      </p>`
    }
  </div>` : ""}

  <!-- CONTACT -->
  ${has.contact ? `
  <footer class="card" id="contact">
    <h2>Contact</h2>
    ${contactInfo.email ? `📧 ${esc(contactInfo.email)}<br><br>` : ""}
    <strong>GitHub:</strong><br>
    <a href="https://github.com/${esc(githubUsername)}" target="_blank">
      github.com/${esc(githubUsername)}
    </a>
    ${contactInfo.linkedin ? `<br><br>🔗 <a href="${esc(contactInfo.linkedin)}">LinkedIn</a>` : ""}
  </footer>` : ""}

</div>

</body>
</html>`;
};
