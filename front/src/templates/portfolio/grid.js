module.exports = (data = {}) => {
  const {
    githubUsername = "DevName",
    summary = "",
    categorizedSkills = {},
    bestProjects = [],
    workExperience = [],
    education = {},
    contactInfo = {},
    customSections = {},
  } = data;

  const has = {
    summary: !!summary,
    skills: Object.keys(categorizedSkills || {}).length > 0,
    projects: (bestProjects || []).length > 0,
    experience: (workExperience || []).length > 0,
    education:
      typeof education === "string"
        ? education.trim().length > 0
        : !!(
            education &&
            (education.degree ||
              education.institution ||
              education.content ||
              education.year ||
              education.dates)
          ),
    contact: contactInfo && (contactInfo.email || contactInfo.linkedin || githubUsername),
  };

  const esc = (s) =>
    typeof s === "string"
      ? s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]))
      : s ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(githubUsername)} — Portfolio</title>

<style>
:root{
  --bg1:#f3e7d3;
  --bg2:#e9dcc3;
  --card:rgba(255,255,255,0.55);
  --card-border:#d2b79a;
  --text:#3d2e1e;
  --muted:#7d6a57;
  --accent:#c89f72;
  --accent2:#b58253;
}
*{ box-sizing:border-box; }

body{
  margin:0;
  background:linear-gradient(180deg,var(--bg1),var(--bg2));
  font-family:Inter,system-ui,Segoe UI,Roboto;
  color:var(--text);
}

/* Navigation */
.nav{
  position:sticky;top:0;z-index:50;
  background:rgba(255,255,255,0.6);
  backdrop-filter:blur(8px);
  border-bottom:1px solid var(--card-border);
}
.nav .row{
  max-width:1180px;margin:0 auto;
  padding:14px 20px;
  display:flex;align-items:center;justify-content:space-between;
}
.links{display:flex;gap:18px;}
.links a{color:var(--text);text-decoration:none;font-weight:600;}
.links a:hover{color:var(--accent2);}

.badge{
  background:linear-gradient(90deg,var(--accent),var(--accent2));
  padding:10px 18px;
  border-radius:12px;
  color:white;
  font-weight:800;
  font-size:24px;       /* ⬅️ INCREASED SIZE */
  letter-spacing:0.5px;
}


/* Layout */
.wrap{ max-width:1180px; margin:0 auto; padding:28px 18px; }

.card{
  background:var(--card);
  border:1px solid var(--card-border);
  border-radius:16px;
  padding:20px;
  backdrop-filter:blur(10px);
  box-shadow:0 8px 22px rgba(0,0,0,0.08);
}

.sec h2{
  margin:0 0 10px 0;
  font-size:24px;
  color:var(--text);
}

/* Projects */
.grid{ display:grid; gap:16px; }
.grid.cols-3{ grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); }

.project{
  background:var(--card);
  border:1px solid var(--card-border);
  padding:16px;
  border-radius:14px;
}
.project h3{
  margin:0 0 6px 0;
  font-size:18px;
  color:var(--accent2);
}

/* Skills */
.small{ color:var(--muted); }

/* Experience */
hr{
  border:none;
  border-top:1px solid var(--card-border);
  margin:16px 0;
}

.anchor{ scroll-margin-top:80px; }

/* Contact */
a{ color:var(--accent2); }
a:hover{ text-decoration:underline; }

</style>
</head>

<body>

<nav class="nav">
  <div class="row">
    <div class="badge">${esc(githubUsername)}</div>
    <div class="links">
      <a href="#summary">Summary</a>
      ${has.projects ? '<a href="#projects">Projects</a>' : ''}
      ${has.skills ? '<a href="#skills">Skills</a>' : ''}
      ${has.experience ? '<a href="#experience">Experience</a>' : ''}
      ${has.education ? '<a href="#education">Education</a>' : ''}
      ${has.contact ? '<a href="#contact">Contact</a>' : ''}
    </div>
  </div>
</nav>

<div class="wrap">

  <section class="anchor" id="summary">
    <div class="card sec">
      <h2>Summary</h2>
      <p class="small" style="line-height:1.8">${esc(summary)}</p>
    </div>
  </section>

  ${has.projects ? `
  <section class="sec anchor" id="projects" style="margin-top:28px">
    <h2>Projects</h2>
    <div class="grid cols-3">
      ${(bestProjects || [])
        .map(
          (p) => `
        <article class="project">
          <h3>${esc(p.name || "Project")}</h3>
          <p class="small">${esc((p.description || "").replace(/^•\s*/, "").split("\\n").join("<br>"))}</p>
          <div class="small" style="margin-top:8px;">
            ${p.language ? `${esc(p.language)} • ` : ""}
            ${p.stargazers_count || p.stars ? `⭐ ${(p.stargazers_count || p.stars)}` : ""}
          </div>
        </article>`
        )
        .join("")}
    </div>
  </section>` : ''}

  ${has.skills ? `
  <section class="card sec anchor" id="skills" style="margin-top:28px">
    <h2>Skills</h2>
    ${Object.entries(categorizedSkills || {})
      .map(
        ([k, v]) => `
      <div style="margin:8px 0">
        <strong>${esc(k)}:</strong>
        <span class="small">${(v || []).map(esc).join(", ")}</span>
      </div>`
      )
      .join("")}
  </section>` : ''}

  ${has.experience ? `
  <section class="card sec anchor" id="experience" style="margin-top:28px">
    <h2>Experience</h2>
    ${(workExperience || [])
      .map(
        (e) => `
      <div style="padding:10px 0">
        <strong>${esc(e.title || "Role")}</strong> — <span class="small">${esc(e.company || "")}</span>
        <div class="small">${esc(e.dates || "")}</div>
        ${
          e.description
            ? `<p class="small" style="margin-top:6px;line-height:1.8">${esc(e.description)}</p>`
            : ""
        }
        <hr />
      </div>`
      )
      .join("")}
  </section>` : ''}

  ${has.education ? `
  <section class="card sec anchor" id="education" style="margin-top:28px">
    <h2>Education</h2>
    <div class="small" style="line-height:1.8">
      ${
        typeof education === "string"
          ? esc(education).replace(/\\n/g, "<br>")
          : `
            ${esc(education.degree || "")}<br>
            ${esc(education.institution || "")}<br>
            ${esc(education.dates || education.year || "")}<br>
            ${education.gpa ? `GPA: ${esc(education.gpa)}` : ""}
          `
      }
    </div>
  </section>` : ''}

  ${has.contact ? `
  <footer class="card sec anchor" id="contact" style="margin-top:28px;margin-bottom:40px">
    <h2>Contact</h2>
    <div class="small" style="display:grid;gap:8px">
      ${contactInfo.email ? `📧 ${esc(contactInfo.email)}<br/>` : ""}

      <strong style="margin-top:10px">GitHub</strong>
      <a href="https://github.com/${esc(githubUsername)}" target="_blank">
        https://github.com/${esc(githubUsername)}
      </a>

      ${contactInfo.linkedin ? `<br/>🔗 <a href="${esc(contactInfo.linkedin)}" target="_blank">LinkedIn</a>` : ""}
    </div>
  </footer>` : ''}

</div>

<script>
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const id = a.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if(el){ e.preventDefault(); el.scrollIntoView({behavior:"smooth"}); }
  });
});
</script>

</body>
</html>`;
};
