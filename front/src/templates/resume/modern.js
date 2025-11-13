export default function atsTemplate(data) {
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
      <div class="skill-block">
        <h4>${cat}</h4>
        <p>${items.join(", ")}</p>
      </div>
    `
    )
    .join("");

  const projectsHTML = (projects.items || [])
    .map(
      (p) => `
      <div class="project">
        <strong>${p.name}</strong> ${p.url ? `<a href="${p.url}" target="_blank">↗</a>` : ""}
        <p>${p.description || ""}</p>
      </div>
    `
    )
    .join("");

  const experienceHTML = (workExperience || [])
    .map(
      (exp) => `
      <div class="exp-item">
        <strong>${exp.title}</strong> — ${exp.company || ""}
        <div class="sub">${exp.dates || ""}</div>
        <p>${exp.description || ""}</p>
      </div>
    `
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
      font-family: "Inter", Arial, sans-serif;
      margin: 0;
      background: #f8f9ff;
      padding: 40px;
    }
    .resume {
      max-width: 900px;
      margin: auto;
      background: #fff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 6px 20px rgba(0,0,0,.08);
    }
    h1 { font-size: 32px; margin-bottom: 4px; }
    h2 { border-left: 4px solid #4f46e5; padding-left: 10px; font-size: 20px; margin-top: 30px; }
    a { color: #4f46e5; text-decoration: none; }
    .row { display: flex; gap: 30px; }
    .col { flex: 1; }
    .skill-block h4 { margin: 6px 0 4px; font-size: 15px; }
    .project, .exp-item { margin-bottom: 16px; }
    .sub { font-size: 13px; color: #666; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="resume">
    <h1>${githubUsername}</h1>
    <div>
      ${contactInfo.email ? `📧 ${contactInfo.email}<br/>` : ""}
      ${contactInfo.mobile ? `📱 ${contactInfo.mobile}<br/>` : ""}
      ${contactInfo.linkedin ? `🔗 <a href="${contactInfo.linkedin}" target="_blank">LinkedIn</a><br/>` : ""}
    </div>

    <h2>Summary</h2>
    <p>${summary || "Motivated developer with strong problem-solving skills."}</p>

    <h2>Skills</h2>
    <div class="row">${skillsHTML}</div>

    <h2>Projects</h2>
    ${projectsHTML}

    <h2>Experience</h2>
    ${experienceHTML}

    <h2>Education</h2>
    <p>${education || "Not provided"}</p>
  </div>
</body>
</html>
`;
};
