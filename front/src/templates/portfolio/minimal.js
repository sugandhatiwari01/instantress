module.exports = (data = {}) => {
  const {
    githubUsername = "YourName",
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
    contact: (contactInfo && (contactInfo.email || contactInfo.mobile || contactInfo.linkedin || githubUsername)),
  };

  const esc = (s) => (typeof s === 'string' ? s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : s ?? '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(githubUsername)} — Portfolio</title>
<style>
:root{
  --bg:#fafafa;--card:#fff;--text:#111827;--muted:#6b7280;--brand:#2563eb;--brand-2:#60a5fa;--ring:#e5e7eb;--chip:#f3f4f6;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Helvetica Neue",Arial}
a{color:var(--brand);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:1100px;margin:0 auto;padding:24px}
.nav{
  position:sticky;top:0;background:rgba(250,250,250,.9);backdrop-filter:saturate(1.2) blur(6px);
  border-bottom:1px solid var(--ring);z-index:50;
}
.nav .row{max-width:1100px;margin:0 auto;display:flex;gap:16px;align-items:center;justify-content:space-between;padding:12px 24px}
.nav .links{display:flex;gap:14px;flex-wrap:wrap}
.nav a{font-weight:600}
.header{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;margin:24px 0}
.title{font-size:28px;margin:0}
.badge{padding:6px 10px;border:1px solid var(--ring);border-radius:999px;background:var(--card)}
.card{background:var(--card);border:1px solid var(--ring);border-radius:14px;padding:20px;margin:16px 0}
.sec h2{margin:0 0 12px 0;font-size:20px}
.grid{display:grid;gap:14px}
.projects{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.project{border:1px solid var(--ring);border-radius:12px;padding:14px;background:#fff}
.project h3{margin:0 0 6px 0;font-size:16px}
.meta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--muted)}
.chip{display:inline-block;background:var(--chip);padding:3px 8px;border-radius:999px;border:1px solid var(--ring)}
.row{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.small{color:var(--muted);font-size:14px}
.footer{margin:28px 0 60px}
.btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--brand),var(--brand-2));
color:#fff;border:none;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}
.btn:disabled{opacity:.6;cursor:not-allowed}
.anchor{scroll-margin-top:80px}
hr{border:none;border-top:1px solid var(--ring);margin:18px 0}
@media (max-width:600px){.title{font-size:22px}}
</style>
</head>
<body>
  <nav class="nav">
    <div class="row">
      <div><span class="badge">${esc(githubUsername)}</span></div>
      <div class="links">
        <a href="#home">Home</a>
        ${has.projects ? '<a href="#projects">Projects</a>' : ''}
        ${has.skills ? '<a href="#skills">Skills</a>' : ''}
        ${has.experience ? '<a href="#experience">Experience</a>' : ''}
        ${has.education ? '<a href="#education">Education</a>' : ''}
        ${has.contact ? '<a href="#contact">Contact</a>' : ''}
      </div>
    </div>
  </nav>

  <div class="wrap">
    <header class="header anchor" id="home">
      <h1 class="title">${esc(githubUsername)}</h1>
      <div class="small">Software Developer • GitHub: <a href="https://github.com/${esc(githubUsername)}" target="_blank" rel="noopener">/${esc(githubUsername)}</a></div>
    </header>

    ${has.summary ? `
    <section class="card sec">
      <h2>Summary</h2>
      <p class="small" style="line-height:1.7">${esc(summary)}</p>
    </section>` : ''}

    ${has.projects ? `
    <section class="sec anchor" id="projects">
      <h2>Projects</h2>
      <div class="grid projects">
        ${(bestProjects||[]).map(p => `
          <article class="project">
            <h3><a href="${esc(p.html_url || p.url || '#')}" target="_blank" rel="noopener">${esc(p.name || 'Project')}</a></h3>
            <p class="small">${esc((p.description || '').replace(/^•\s*/,'').split('\\n').join('<br>'))}</p>
            <div class="meta">
              ${p.language ? `<span class="chip">${esc(p.language)}</span>`:''}
              ${p.stargazers_count || p.stars ? `<span>⭐ ${(p.stargazers_count||p.stars)}</span>`:''}
            </div>
          </article>
        `).join('')}
      </div>
    </section>` : ''}

    ${has.skills ? `
    <section class="card sec anchor" id="skills">
      <h2>Skills</h2>
      ${Object.entries(categorizedSkills||{}).map(([k,v])=>`
        <div style="margin:6px 0">
          <strong>${esc(k)}:</strong>
          <span class="small">${(v||[]).map(esc).join(', ')}</span>
        </div>
      `).join('')}
    </section>` : ''}

    ${has.experience ? `
    <section class="card sec anchor" id="experience">
      <h2>Experience</h2>
      ${(workExperience||[]).map(e=>`
        <div style="padding:10px 0">
          <div class="row">
            <strong>${esc(e.title || 'Role')}</strong>
            <span class="small">${esc(e.dates || '')}</span>
          </div>
          <div class="small">${esc(e.company || '')}</div>
          ${e.description ? `<p class="small" style="margin-top:6px;line-height:1.7">${esc(e.description)}</p>`:''}
          <hr />
        </div>
      `).join('')}
    </section>` : ''}

    ${has.education ? `
<section class="card sec anchor" id="education">
  <h2>Education</h2>
  <div class="small" style="line-height:1.7">
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
    <footer class="card footer anchor" id="contact">
      <h2>Contact</h2>
      <div class="small" style="display:grid;gap:6px">
        ${contactInfo.email ? `📧 ${esc(contactInfo.email)}<br/>` : ''}
        ${contactInfo.mobile ? `📱 ${esc(contactInfo.mobile)}<br/>` : ''}
        ${contactInfo.linkedin ? `🔗 <a href="${esc(contactInfo.linkedin)}" target="_blank" rel="noopener">LinkedIn</a><br/>` : ''}
        🐙 <a href="https://github.com/${esc(githubUsername)}" target="_blank" rel="noopener">GitHub</a>
      </div>
      <div style="margin-top:14px">
        <button class="btn" id="resumeBtn">⬇ Download Resume (HTML)</button>
      </div>
    </footer>` : ''}
  </div>

<script>
(function(){
  const backend = window.PORTFOLIO_BACKEND || 'http://localhost:4000';
  const btn = document.getElementById('resumeBtn');
  if(btn){
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try{
        const payload = {
          template: "minimal",
          githubUsername: ${JSON.stringify(githubUsername)},
          summary: ${JSON.stringify(summary)},
          categorizedSkills: ${JSON.stringify(categorizedSkills)},
          bestProjects: ${JSON.stringify(bestProjects)},
          workExperience: ${JSON.stringify(workExperience)},
          education: ${JSON.stringify(education)},
          contactInfo: ${JSON.stringify(contactInfo)},
          customSections: ${JSON.stringify(customSections)}
        };
        const res = await fetch(backend + '/api/export-resume-html', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error('Failed: ' + res.status);
        const html = await res.text();
        const blob = new Blob([html], {type:'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'resume.html'; a.click();
        URL.revokeObjectURL(url);
      }catch(e){ alert('Resume download failed: ' + e.message); }
      finally{ btn.disabled = false; }
    });
  }
  // smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });
})();
</script>
</body>
</html>`;
};
