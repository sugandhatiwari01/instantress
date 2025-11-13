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
      <div class="skill">
        <strong>${cat}:</strong> ${items.join(", ")}
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
      background: #f2f4ff;
      padding: 40px;
    }
    .resume {
      max-width: 900px;
      margin: auto;
      background: white;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,.12);
    }
    .header {
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: white;
      padding: 36px;
    }
    .header h1 {
      margin: 0;
      font-size: 34px;
    }
    .header p { margin: 6px 0 0; font-size: 15px; }
    .section {
      padding: 30px 40px;
      border-bottom: 1px solid #eee;
    }
    .section:last-child { border-bottom: none; }
    .title {
      font-size: 20px;
      margin-bottom: 14px;
      color: #4f46e5;
      font-weight: bold;
    }
    .skill, .project, .exp { margin-bottom: 14px; }
    .p-title, .exp-title {
      font-weight: bold;
      font-size: 15px;
    }
    .exp-date { font-size: 13px; color: #666; margin-bottom: 4px; }
    a { color: #4f46e5; text-decoration: none; }
  </style>

</head>
<body>

<div class="resume">

  <div class="header">
    <h1>${githubUsername}</h1>
    <p>
      ${contactInfo.email ? `${contactInfo.email} • ` : ""}
      ${contactInfo.mobile ? `${contactInfo.mobile} • ` : ""}
      ${contactInfo.linkedin ? `<a style="color:white;" href="${contactInfo.linkedin}" target="_blank">LinkedIn</a>` : ""}
    </p>
  </div>

  ${
    summary
      ? `<div class="section"><div class="title">Summary</div><p>${summary}</p></div>`
      : ""
  }

  ${
    skillsHTML
      ? `<div class="section"><div class="title">Skills</div>${skillsHTML}</div>`
      : ""
  }

  ${
    projectsHTML
      ? `<div class="section"><div class="title">Projects</div>${projectsHTML}</div>`
      : ""
  }

  ${
    experienceHTML
      ? `<div class="section"><div class="title">Experience</div>${experienceHTML}</div>`
      : ""
  }

  ${
    education
      ? `<div class="section"><div class="title">Education</div><p>${education}</p></div>`
      : ""
  }

</div>

</body>
</html>
`;
};
