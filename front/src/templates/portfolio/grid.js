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
    education: !!(education && (education.degree || education.institution || education.content || education.year || education.dates)),
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
  --bg:#0b1020;--panel:#0f162b;--card:#111a33;--ring:#1f2a44;--text:#e5ecff;--muted:#9fb3ff;
  --brand:#22d3ee;--brand2:#60a5fa;--chip:#0b1a3a;
}
*{box-sizing:border-box}
body{margin:0;background:linear-gradient(180deg,#0a0f1f,#0b1020 30%,#0d1430 100%);color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial}
a{color:#a5b4fc;text-decoration:none}
a:hover{text-decoration:underline}
.nav{position:sticky;top:0;z-index:50;background:rgba(10,15,31,.6);backdrop-filter:blur(8px);border-bottom:1px solid var(--ring)}
.nav .row{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 20px}
.links{display:flex;gap:16px;flex-wrap:wrap}
.badge{background:var(--chip);padding:8px 12px;border-radius:10px;border:1px solid var(--ring);font-weight:700}
.wrap{max-width:1200px;margin:0 auto;padding:28px 18px}
.hero{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between}
.title{font-size:30px;margin:0}
.kbd{font-size:12px;border:1px solid var(--ring);padding:4px 8px;border-radius:8px;background:#0b1433}
.grid{display:grid;gap:16px}
.grid.cols-3{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.card{background:var(--card);border:1px solid var(--ring);border-radius:16px;padding:18px}
.sec h2{margin:0 0 12px 0}
.project h3{margin:0 0 6px 0;font-size:18px}
.meta{display:flex;gap:10px;flex-wrap:wrap;color:var(--muted);font-size:12px}
.chip{display:inline-block;background:#0c1d49;border:1px solid var(--ring);padding:4px 8px;border-radius:999px}
.btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#0b1020;
font-weight:800;border:none;border-radius:10px;padding:10px 14px;cursor:pointer}
.btn:disabled{opacity:.6}
hr{border:none;border-top:1px solid var(--ring);margin:16px 0}
.anchor{scroll-margin-top:80px}
.small{color:var(--muted)}
</style>
</head>
<body>
<nav class="nav">
  <div class="row">
    <div class="badge">${esc(githubUsername)}</div>
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
  <section class="hero anchor" id="home">
    <h1 class="title">Hi, I'm ${esc(githubUsername)}</h1>
    <span class="kbd">npm i curiosity —save</span>
  </section>

  ${has.summary ? `
  <section class="card sec">
    <h2>Summary</h2>
    <p class="small" style="line-height:1.8">${esc(summary)}</p>
  </section>` : ''}

  ${has.projects ? `
  <section class="sec anchor" id="projects">
    <h2>Projects</h2>
    <div class="grid cols-3">
      ${(bestProjects||[]).map(p=>`
        <article class="card project">
          <h3><a href="${esc(p.html_url || p.url || '#')}" target="_blank" rel="noopener">${esc(p.name||'Project')}</a></h3>
          <p class="small">${esc((p.description||'').replace(/^•\\s*/,'').split('\\n').join('<br>'))}</p>
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
      <div style="margin:8px 0">
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
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <strong>${esc(e.title||'Role')}</strong>
          <span class="small">${esc(e.dates||'')}</span>
        </div>
        <div class="small">${esc(e.company||'')}</div>
        ${e.description?`<p class="small" style="margin-top:6px;line-height:1.8">${esc(e.description)}</p>`:''}
        <hr>
      </div>
    `).join('')}
  </section>` : ''}

  ${has.education ? `
  <section class="card sec anchor" id="education">
    <h2>Education</h2>
    <div class="small">
      ${esc(education.degree || education.content || 'Education')}
      ${education.institution ? `, ${esc(education.institution)}`:''}
      ${education.dates || education.year ? ` (${esc(education.dates || education.year)})`:''}
      ${education.gpa ? `; GPA: ${esc(education.gpa)}`:''}
    </div>
  </section>` : ''}

  ${has.contact ? `
  <footer class="card sec anchor" id="contact">
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
        if(!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();
        const blob = new Blob([html], {type:'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download='resume.html'; a.click();
        URL.revokeObjectURL(url);
      }catch(e){ alert('Resume download failed: ' + e.message); }
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
