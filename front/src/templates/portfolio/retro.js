// retroTerminal.js
module.exports = (data = {}) => {
  const {
    githubUsername = "RetroDev",
    summary = "",
    categorizedSkills = {},
    bestProjects = [],
    workExperience = [],
    education = "",
    contactInfo = {},
    customSections = {},
  } = data;

  const esc = (s) =>
    typeof s === "string"
      ? s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]))
      : s ?? "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(githubUsername)} — Retro Terminal</title>
<style>
  html,body{height:100%;margin:0;font-family:'Courier New',Courier,monospace;background:#041006;color:#9ff39f}
  .wrap{max-width:980px;margin:28px auto;padding:18px}
  .term{background:#031006;border:1px solid #06320a;padding:18px;border-radius:8px;box-shadow:0 6px 30px rgba(0,0,0,0.6)}
  .header{display:flex;align-items:center;gap:12px;margin-bottom:14px}
  .logo{background:#042a0b;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.02);font-weight:700}
  .screen{background:#001207;padding:12px;border-radius:6px;font-size:14px;line-height:1.8;border:1px solid #064617;overflow:auto}
  .prompt{color:#baffb6}
  .cursor{display:inline-block;width:10px;height:16px;background:#9ff39f;margin-left:6px;animation:blink 1s steps(2) infinite;vertical-align:middle}
  @keyframes blink{50%{opacity:0}}
  .section{margin-top:12px}
  .project{border-top:1px dashed rgba(159,243,159,0.08);padding-top:10px;margin-top:10px}
  a{color:#9ff39f}
  .muted{color:#77b77b;font-size:13px}
</style>
</head>
<body>
  <div class="wrap">
    <div class="term">
      <div class="header">
        <div class="logo">~/${esc(githubUsername)}</div>
      </div>

      <div class="screen" id="screen">
        <div><span class="prompt">> </span><strong>${esc(githubUsername)}</strong><span class="cursor"></span></div>
        <div><span class="prompt">> </span><span class="muted">About:</span> ${esc(summary || "I build simple things that scale.")}</div>

        ${
          Object.keys(categorizedSkills || {}).length
            ? `<div class="section"><span class="muted">Skills:</span>
          ${Object.entries(categorizedSkills)
            .map(([k, v]) => `\n  ${esc(k)}: ${(v || []).slice(0, 6).map(esc).join(", ")}`)
            .join("<br/>")}
        </div>`
            : ""
        }

        ${
          bestProjects && bestProjects.length
            ? `<div class="section"><span class="muted">Projects:</span>
          ${bestProjects
            .map(
              (p) => `
            <div class="project">
              <div><strong>${esc(p.name || "Project")}</strong> — <a href="${esc(
                p.html_url || p.url || "#"
              )}" target="_blank">open</a></div>
              <div class="muted">${esc((p.description || "").replace(/^•\\s*/, ""))}</div>
            </div>
          `
            )
            .join("")}
        </div>`
            : ""
        }

        ${
          workExperience && workExperience.length
            ? `<div class="section"><span class="muted">Experience:</span>
          ${workExperience
            .map(
              (e) => `
            <div class="project">
              <div><strong>${esc(e.title || "Role")}</strong> @ ${esc(e.company || "")}</div>
              <div class="muted">${esc(e.dates || "")}</div>
              <div class="muted">${esc(e.description || "")}</div>
            </div>
          `
            )
            .join("")}
        </div>`
            : ""
        }

        <div class="section">
          <div class="muted">Contact:</div>
          <div style="margin-top:6px">
            ${contactInfo.email ? `✉ ${esc(contactInfo.email)}  ` : ""}

            <!-- GitHub added -->
            🐙 <a href="https://github.com/${esc(githubUsername)}" target="_blank">
              github.com/${esc(githubUsername)}
            </a>

            ${contactInfo.linkedin ? `<br/>🔗 <a href="${esc(contactInfo.linkedin)}" target="_blank">LinkedIn</a>` : ""}
          </div>
        </div>

      </div>
    </div>
  </div>

<script>
// cursor blink effect
setInterval(() => {
  const c = document.querySelector('.cursor');
  if (c) c.style.visibility = c.style.visibility === 'hidden' ? 'visible' : 'hidden';
}, 600);
</script>
</body>
</html>`;
};
