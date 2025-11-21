// modernTwoColumn.js
module.exports = (data = {}) => {
  const {
    fullName = "Your Name",
    githubUsername = "username",

    // LinkedIn picture may come from different fields
    linkedinPicture = "",
    pictureUrl = "",

    summary = "",
    categorizedSkills = {},
    bestProjects = [],
    workExperience = [],
    education = "",
    contactInfo = {},
  } = data;

  // Choose whichever picture exists
  const finalPicture =
    linkedinPicture ||
    pictureUrl ||
    "https://via.placeholder.com/150?text=No+Image";

  const finalName = fullName || githubUsername || "Your Name";

  const esc = (s) =>
    typeof s === "string"
      ? s.replace(/[&<>"']/g, (m) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m]))
      : s ?? "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(finalName)} — Portfolio</title>

<style>
  :root {
    --bg: #f4f4f7;
    --text: #1f1f1f;
    --muted: #6b7280;
    --primary: #4f46e5;
    --card: #ffffff;
    --sidebar: #ffffff;
    --border: #e5e7eb;
  }

  body {
    margin: 0;
    background: var(--bg);
    font-family: "Inter", sans-serif;
    color: var(--text);
  }

  .layout {
    display: flex;
    min-height: 100vh;
  }

  /* LEFT SIDEBAR */
  .sidebar {
    width: 300px;
    background: var(--sidebar);
    border-right: 1px solid var(--border);
    padding: 30px 20px;
  }

  .profile-pic {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    margin: 0 auto 18px auto;
    border: 4px solid var(--primary);
    background: #ddd;
  }

  .name {
    text-align: center;
    font-size: 22px;
    font-weight: 700;
  }

  .contact {
    margin-top: 20px;
    font-size: 14px;
    color: var(--muted);
  }

  .contact a {
    color: var(--primary);
    text-decoration: none;
  }

  /* RIGHT CONTENT */
  .content {
    flex: 1;
    padding: 40px;
  }

  .section {
    background: var(--card);
    padding: 22px;
    border-radius: 14px;
    border: 1px solid var(--border);
    margin-bottom: 24px;
  }

  h2 {
    margin: 0 0 12px 0;
    font-size: 20px;
    color: var(--primary);
  }

  .skill-cat {
    margin-bottom: 8px;
    font-size: 15px;
  }

  .project {
    margin-bottom: 14px;
  }

  .project-title {
    font-weight: 600;
    color: var(--primary);
  }

  .muted {
    color: var(--muted);
  }
</style>

</head>
<body>

<div class="layout">

  <!-- SIDEBAR -->
  <aside class="sidebar">

    <img src="${esc(finalPicture)}" class="profile-pic" alt="Profile Picture"/>

    <div class="name">${esc(finalName)}</div>

    <div class="contact">
      ${contactInfo.email ? `📧 ${esc(contactInfo.email)}<br>` : ""}
      ${
        contactInfo.linkedin
          ? `🔗 <a href="${esc(contactInfo.linkedin)}" target="_blank">LinkedIn</a><br>`
          : ""
      }
      🐙 <a href="https://github.com/${esc(githubUsername)}" target="_blank">GitHub</a>
    </div>
  </aside>

  <!-- MAIN CONTENT -->
  <main class="content">

    ${
      summary
        ? `<div class="section">
            <h2>Summary</h2>
            <p>${esc(summary)}</p>
           </div>`
        : ""
    }

    ${
      Object.keys(categorizedSkills).length
        ? `<div class="section">
            <h2>Skills</h2>
            ${Object.entries(categorizedSkills)
              .map(
                ([cat, items]) =>
                  `<div class="skill-cat"><strong>${esc(cat)}:</strong> ${items
                    .map(esc)
                    .join(", ")}</div>`
              )
              .join("")}
          </div>`
        : ""
    }

    ${
      bestProjects.length
        ? `<div class="section">
            <h2>Projects</h2>
            ${bestProjects
              .map(
                (p) => `
              <div class="project">
                <div class="project-title">${esc(p.name)}</div>
                <div class="muted">${esc(p.description || "")}</div>
                ${
                  p.url
                    ? `<a href="${esc(p.url)}" target="_blank">View Project →</a>`
                    : ""
                }
              </div>`
              )
              .join("")}
          </div>`
        : ""
    }

    ${
      workExperience.length
        ? `<div class="section">
            <h2>Experience</h2>
            ${workExperience
              .map(
                (e) => `
              <div style="margin-bottom:12px;">
                <strong>${esc(e.title)}</strong> — ${esc(e.company)}
                <div class="muted">${esc(e.dates || "")}</div>
                <div>${esc(e.description || "")}</div>
              </div>`
              )
              .join("")}
          </div>`
        : ""
    }

    ${
      education
        ? `<div class="section">
            <h2>Education</h2>
            <p>${esc(education)}</p>
           </div>`
        : ""
    }

  </main>
</div>

</body>
</html>
`;
};
