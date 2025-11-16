module.exports = (data = {}) => {
  const {
    githubUsername = "GlassDev",
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

  // 🔥 FIX: Support both string + object for education
  education: typeof education === "string"
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
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(githubUsername)} — Portfolio</title>
<style>
:root{
  --bg1:#e9d5ff;--bg2:#c7d2fe;--text:#0f172a;--muted:#475569;--card:rgba(255,255,255,.66);--ring:rgba(15,23,42,.12);
  --brand:#7c3aed;--brand2:#2563eb;--chip:rgba(15,23,42,.06);
}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:linear-gradient(135deg,var(--bg1),var(--bg2));color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto}
a{color:var(--brand);text-decoration:none}
a:hover{text-decoration:underline}
.nav{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.4);backdrop-filter:blur(10px) saturate(1.2);border-bottom:1px solid var(--ring)}
.nav .row{max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 20px}
.links{display:flex;gap:14px;flex-wrap:wrap}
.logo{font-weight:900;letter-spacing:.06em}
.wrap{max-width:1100px;margin:0 auto;padding:28px 18px}
.glass{background:var(--card);border:1px solid var(--ring);border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.15)}
.pad{padding:18px}
.hero{display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap}
.title{font-size:30px;margin:0}
.small{color:var(--muted)}
.sec h2{margin:0 0 10px 0}
.grid{display:grid;gap:16px}
.grid.cols-3{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.project{border:1px dashed var(--ring);border-radius:14px;padding:14px;background:rgba(255,255,255,.6)}
.project h3{margin:0 0 6px 0}
.meta{display:flex;gap:10px;flex-wrap:wrap;color:var(--muted);font-size:12px}
.chip{display:inline-block;background:var(--chip);padding:4px 8px;border-radius:999px;border:1px solid var(--ring)}
.btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#fff;font-weight:800;
border:none;border-radius:10px;padding:10px 14px;cursor:pointer}
.btn:disabled{opacity:.6}
.anchor{scroll-margin-top:80px}
hr{border:none;border-top:1px solid var(--ring);margin:12px 0}
</style>
</head>
<body>
<nav class="nav">
  <div class="row">
    <div class="logo">👋 ${esc(githubUsername)}</div>
    <div class="links">
      <a href="#home">Home</a>
      ${has.projects ? '<a href="#projects">Projects</a>':''}
      ${has.skills ? '<a href="#skills">Skills</a>':''}
      ${has.experience ? '<a href="#experience">Experience</a>':''}
      ${has.education ? '<a href="#education">Education</a>':''}
      ${has.contact ? '<a href="#contact">Contact</a>':''}
    </div>
  </div>
</nav>

<div class="wrap">
  <section class="glass pad hero anchor" id="home">
    <h1 class="title">${esc(githubUsername)}</h1>
    <div class="small">Glassmorphism • clean & friendly</div>
  </section>

  ${has.summary ? `
  <section class="glass pad sec">
    <h2>Summary</h2>
    <p class="small" style="line-height:1.8">${esc(summary)}</p>
  </section>` : ''}

  ${has.projects ? `
  <section class="sec anchor" id="projects">
    <h2>Projects</h2>
    <div class="grid cols-3">
      ${(bestProjects||[]).map(p=>`
        <article class="project glass">
          <div class="pad">
            <h3><a href="${esc(p.html_url || p.url || '#')}" target="_blank" rel="noopener">${esc(p.name||'Project')}</a></h3>
            <p class="small">${esc((p.description||'').replace(/^•\\s*/,'').split('\\n').join('<br>'))}</p>
            <div class="meta">
              ${p.language?`<span class="chip">${esc(p.language)}</span>`:''}
              ${p.stargazers_count || p.stars ? `<span>⭐ ${(p.stargazers_count||p.stars)}</span>`:''}
            </div>
          </div>
        </article>
      `).join('')}
    </div>
  </section>` : ''}

  ${has.skills ? `
  <section class="glass pad sec anchor" id="skills">
    <h2>Skills</h2>
    ${Object.entries(categorizedSkills||{}).map(([k,v])=>`
      <div style="margin:8px 0">
        <strong>${esc(k)}:</strong>
        <span class="small">${(v||[]).map(esc).join(', ')}</span>
      </div>
    `).join('')}
  </section>` : ''}

  ${has.experience ? `
  <section class="glass pad sec anchor" id="experience">
    <h2>Experience</h2>
    ${(workExperience||[]).map(e=>`
      <div style="padding:8px 0">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <strong>${esc(e.title||'Role')}</strong>
          <span class="small">${esc(e.dates||'')}</span>
        </div>
        <div class="small">${esc(e.company||'')}</div>
        ${e.description?`<p class="small" style="margin-top:6px;line-height:1.8">${esc(e.description)}</p>`:''}
        <hr />
      </div>
    `).join('')}
  </section>` : ''}

  ${has.education ? `
  <section class="glass pad sec anchor" id="education">
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
  <footer class="glass pad sec anchor" id="contact">
    <h2>Contact</h2>
    <div class="small" style="display:grid;gap:6px">
      ${contactInfo.email ? `📧 ${esc(contactInfo.email)}<br/>` : ''}
      ${contactInfo.mobile ? `📱 ${esc(contactInfo.mobile)}<br/>` : ''}
      ${contactInfo.linkedin ? `🔗 <a target="_blank" rel="noopener" href="${esc(contactInfo.linkedin)}">LinkedIn</a><br/>` : ''}
      🐙 <a target="_blank" rel="noopener" href="https://github.com/${esc(githubUsername)}">GitHub</a>
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
    btn.addEventListener('click', async ()=>{
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
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error('HTTP '+res.status);
        const html = await res.text();
        const blob = new Blob([html], {type:'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download='resume.html'; a.click();
        URL.revokeObjectURL(url);
      }catch(e){ alert('Resume download failed: '+e.message); }
      finally{ btn.disabled=false; }
    });
  }
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const id=a.getAttribute('href').slice(1), el=document.getElementById(id);
      if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth'}); }
    });
  });
})();
</script>
</body>
</html>`;
};
