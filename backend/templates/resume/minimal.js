module.exports = function minimalTemplate(data) {
  const {
    githubUsername,
    summary,
    categorizedSkills = {},
    projects = { items: [] },
    workExperience = [],
    education = "",
    contactInfo = {},
  } = data;

  // Convert skills object → HTML rows
  const skillsHTML = Object.entries(categorizedSkills)
    .map(([category, items]) => `
      <p><strong>${category}:</strong> ${items.join(", ")}</p>
    `)
    .join("");

  // Convert projects array → HTML
  const projectsHTML = (projects.items || [])
    .map(
      (p) => `
      <div style="margin-bottom:10px;">
        <strong>${p.name}</strong>${
          p.url ? ` - <a href="${p.url}" target="_blank">${p.url}</a>` : ""
        }
        <p style="margin:4px 0;">${p.description || ""}</p>
      </div>`
    )
    .join("");

  // Convert experience array → HTML
  const experienceHTML = (workExperience || [])
    .map(
      (exp) => `
      <div style="margin-bottom:10px;">
        <strong>${exp.title}</strong> - ${exp.company || ""} <br />
        <em>${exp.dates || ""}</em>
        <p style="margin:4px 0;">${exp.description || ""}</p>
      </div>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${githubUsername}'s Resume</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      margin: 40px;
    }
    h1, h2 { margin-bottom: 4px; }
    h2 { border-bottom: 1px solid #000; padding-bottom: 2px; margin-top: 24px; }
    a { color: #000; }
  </style>
</head>
<body>

  <h1>${githubUsername}</h1>
  <p>
    ${contactInfo.email ? `📧 ${contactInfo.email}<br />` : ""}
    ${contactInfo.mobile ? `📱 ${contactInfo.mobile}<br />` : ""}
    ${
      contactInfo.linkedin
        ? `💼 <a href="${contactInfo.linkedin}" target="_blank">LinkedIn</a><br />`
        : ""
    }
  </p>

  <h2>Summary</h2>
  <p>${summary || "A dedicated developer."}</p>

  <h2>Skills</h2>
  ${skillsHTML || "<p>No skills listed</p>"}

  <h2>Projects</h2>
  ${projectsHTML || "<p>No projects listed</p>"}

  <h2>Experience</h2>
  ${experienceHTML || "<p>No experience listed</p>"}

  <h2>Education</h2>
  <p>${education || "Not provided"}</p>

</body>
</html>
`;
};
