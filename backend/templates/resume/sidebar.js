module.exports = function sidebarTemplate(data) {
  const {
    githubUsername,
    summary,
    categorizedSkills = {},
    projects = { items: [] },
    workExperience = [],
    education = "",
    contactInfo = {},
  } = data;

  const skillsHTML = Object.entries(categorizedSkills)
    .map(
      ([cat, items]) => `
      <div class="skill-cat">
        <strong>${cat}</strong>
        <p>${items.join(", ")}</p>
      </div>`
    )
    .join("");

  const projectsHTML = (projects.items || [])
    .map(
      (p) => `
      <div class="project">
        <div class="p-title">${p.name}</div>
        ${p.url ? `<a href="${p.url}" target="_blank">${p.url}</a>` : ""}
        <p>${p.description || ""}</p>
      </div>`
    )
    .join("");

  const experienceHTML = (workExperience || [])
    .map(
      (exp) => `
      <div class="exp">
        <div class="exp-title">${exp.title} — ${exp.company || ""}</div>
        <div class="exp-date">${exp.dates || ""}</div>
        <p>${exp.description || ""}</p>
      </div>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${githubUsername} - Resume</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      background: #f4f5fa;
    }
    .wrapper {
      display: flex;
      width: 100%;
      min-height: 100vh;
    }
    .sidebar {
      width: 260px;
      background: #1f2937;
      color: white;
      padding: 30px;
    }
    .sidebar h2 {
      font-size: 20px;
      margin-bottom: 8px;
      border-bottom: 1px solid #374151;
      padding-bottom: 6px;
    }
    .sidebar p, .sidebar a {
      font-size: 14px;
      line-height: 1.4;
      color: #e5e7eb;
    }
    .sidebar a { color: #93c5fd; text-decoration: none; }

    .content {
      flex: 1;
      padding: 40px;
      background: white;
    }
    h1 {
      margin-top: 0;
      font-size: 32px;
      color: #111827;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 22px;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 4px;
      margin-bottom: 12px;
      font-weight: bold;
    }
    .exp, .project { margin-bottom: 14px; }
    .exp-title, .p-title { font-weight: bold; font-size: 15px; }
    .exp-date { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
  </style>
</head>

<body>
<div class="wrapper">

  <!-- Sidebar -->
  <div class="sidebar">
    <h1 style="color:white; font-size:24px; margin-bottom:12px;">${githubUsername}</h1>

    <h2>Contact</h2>
    <p>${contactInfo.email || ""}</p>
    <p>${contactInfo.mobile || ""}</p>
    ${
      contactInfo.linkedin
        ? `<p><a href="${contactInfo.linkedin}" target="_blank">LinkedIn</a></p>`
        : ""
    }

    ${
      skillsHTML
        ? `<h2>Skills</h2>${skillsHTML}`
        : ""
    }
  </div>

  <!-- Main Content -->
  <div class="content">
    ${
      summary
        ? `<div class="section"><div class="section-title">Summary</div><p>${summary}</p></div>`
        : ""
    }

    ${
      projectsHTML
        ? `<div class="section"><div class="section-title">Projects</div>${projectsHTML}</div>`
        : ""
    }

    ${
      experienceHTML
        ? `<div class="section"><div class="section-title">Experience</div>${experienceHTML}</div>`
        : ""
    }

    ${
      education
        ? `<div class="section"><div class="section-title">Education</div><p>${education}</p></div>`
        : ""
    }
  </div>

</div>
</body>
</html>
`;
};
