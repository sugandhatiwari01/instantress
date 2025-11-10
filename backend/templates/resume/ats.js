module.exports = function atsTemplate(data) {
  const {
    githubUsername,
    summary,
    categorizedSkills = {},
    projects = { items: [] },
    workExperience = [],
    education = "",
    contactInfo = {},
  } = data;

  const skillsText = Object.entries(categorizedSkills)
    .map(([category, items]) => `${category}: ${items.join(", ")}`)
    .join("\n");

  const projectsText = (projects.items || [])
    .map((p) => `• ${p.name}${p.url ? ` (${p.url})` : ""}\n  ${p.description || ""}`)
    .join("\n\n");

  const experienceText = (workExperience || [])
    .map(
      (exp) => `• ${exp.title} - ${exp.company || ""}\n  ${exp.dates || ""}\n  ${
        exp.description || ""
      }`
    )
    .join("\n\n");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${githubUsername} - Resume</title>
  <style>
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.4;
      margin: 40px;
      color: #000;
    }
    h1 { font-size: 20pt; margin-bottom: 4px; }
    h2 { font-size: 13pt; margin-top: 20px; margin-bottom: 6px; }
    pre { white-space: pre-wrap; font-family: inherit; }
    a { color: black; text-decoration: none; }
  </style>
</head>
<body>

  <h1>${githubUsername}</h1>
  <p>
    ${contactInfo.email ? `Email: ${contactInfo.email}<br />` : ""}
    ${contactInfo.mobile ? `Phone: ${contactInfo.mobile}<br />` : ""}
    ${
      contactInfo.linkedin
        ? `LinkedIn: ${contactInfo.linkedin}<br />`
        : ""
    }
  </p>

  <h2>SUMMARY</h2>
  <p>${summary || "Motivated professional with experience in software development."}</p>

  <h2>SKILLS</h2>
  <pre>${skillsText || "No skills listed"}</pre>

  <h2>PROJECTS</h2>
  <pre>${projectsText || "No projects listed"}</pre>

  <h2>EXPERIENCE</h2>
  <pre>${experienceText || "No experience listed"}</pre>

  <h2>EDUCATION</h2>
  <p>${education || "Not provided"}</p>

</body>
</html>
`;
};
