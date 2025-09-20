const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const puppeteer = require("puppeteer");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const JSZip = require("jszip");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not set in .env. Please configure it.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let model;
try {
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} catch (error) {
  console.error("Error initializing Gemini model:", error);
  process.exit(1);
}

// Process Data Endpoint
app.post("/api/process-data", async (req, res) => {
  const { githubUser, leetcodeUser, workExperience, education } = req.body;
  console.log("Request body:", req.body);
  try {
    // Fetch GitHub
    const githubRes = await axios.get(`https://api.github.com/users/${githubUser}/repos`, {
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!githubRes.data) throw new Error("GitHub user not found");
    const repos = githubRes.data;
    let allLanguages = [...new Set(repos.map((r) => r.language).filter(Boolean))];

    // Fetch LeetCode (optional, for additional languages like C/C++)
    let leetcodeLanguages = [];
    if (leetcodeUser) {
      const query = {
        query: `query getUserProfile($username: String!) { matchedUser(username: $username) { username submitStats { acSubmissionNum { difficulty count } } } }`,
        variables: { username: leetcodeUser },
      };
      const lcRes = await axios.post("https://leetcode.com/graphql", query, {
        headers: { "Content-Type": "application/json" },
      });
      const lcData = lcRes.data.data.matchedUser;
      if (lcData) {
        // Infer languages from solved problems (e.g., if medium/hard in All, assume C/C++ for DSA)
        if (lcData.submitStats.acSubmissionNum.find(s => s.difficulty === "Medium")?.count > 50) {
          leetcodeLanguages = ["C", "C++"];
        }
      }
    }
    allLanguages = [...allLanguages, ...leetcodeLanguages];

    // Categorize Skills
    const categorizedSkills = {
      "Programming Languages": ["JavaScript", "C", "C++", "PL/SQL"].filter(lang => allLanguages.includes(lang)),
      "Frontend": ["HTML", "CSS", "React.js", "Bootstrap", "TailwindCSS"].filter(lang => allLanguages.includes(lang) || lang === "React.js"),
      "Backend": ["Node.js", "Express.js", "MongoDB", "Firebase"].filter(lang => allLanguages.includes(lang) || lang === "MongoDB"),
      "Tools/Other": ["Git", "GitHub", "Figma", "Canva", "VSCode"].filter(lang => allLanguages.includes(lang))
    };


    async function safeGenerateContent(prompt, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      if (i === retries - 1) throw err; // final failure
      console.warn(`Gemini call failed (attempt ${i + 1}), retrying...`);
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
}

    

async function summarizeReadme(repoName, readmeText) {
  const prompt = `
  Summarize the following GitHub project README into a clear, concise description in 2-3 bullet points highlighting key features, technologies, and achievements (avoid marketing language, keep it technical).

  Project: ${repoName}
  README:
  ${readmeText}
  `;

  try {
    const result = await safeGenerateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error(`Error summarizing README for ${repoName}:`, err);
    return "No description available";
  }
}


function getLanguageScore(languages) {
  // languages is an array of repo languages
  let score = 0;
  languages.forEach(lang => {
    lang = lang.toLowerCase();
    if (/typescript|react|next|node|django|spring|rust|go|kotlin|swift|scala/.test(lang)) {
      score += 10; // advanced
    } else if (/java|c\+\+|c#|python|php/.test(lang)) {
      score += 7;  // intermediate
    } else if (/html|css|markdown|shell|sql/.test(lang)) {
      score += 3;  // basic
    } else {
      score += 5;  // unknown, give medium default
    }
  });
  return score;
}



async function fetchRepoLanguages(owner, repo) {
  try {
    const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`);
    // returns object like {JavaScript: 12345, HTML: 2345}
    return Object.keys(res.data);
  } catch (err) {
    console.warn(`Error fetching languages for ${repo}:`, err.message);
    return [];
  }
}



    // Select 2 Best Projects (prioritize full-stack, descriptions, recency)
 // Inside the /api/process-data endpoint, replace the fallback logic
// Select 2 Best Projects (prioritize full-stack, descriptions, recency)
// Correct: await Promise.all first
let allProjects = await Promise.all(
  repos
    .filter(r => !r.fork)
    .map(async (r) => {
      const languages = await fetchRepoLanguages(githubUser, r.name);
      const langScore = getLanguageScore(languages);

      const recencyScore = Math.max(
        0,
        6 - (Date.now() - new Date(r.pushed_at)) / (1000 * 60 * 60 * 24 * 30)
      );
      const descScore = r.description ? 3 : 0;

      const totalScore = langScore + recencyScore + descScore;

      let readmeSummary = r.description || "No description available";
      try {
        const readmeRes = await axios.get(
          `https://api.github.com/repos/${githubUser}/${r.name}/readme`,
          { headers: { Accept: "application/vnd.github.v3.raw" } }
        );
        readmeSummary = await summarizeReadme(r.name, readmeRes.data);
      } catch {
        // fallback already assigned
      }

      return { ...r, description: readmeSummary, score: totalScore };
    })
);

// Sort the resolved array
allProjects.sort((a, b) => b.score - a.score);
const bestProjects = allProjects.slice(0, 2);




    // Gemini Prompt (general for any position)

    const prompt = `
      Format this developer data into a professional resume summary (3-5 sentences) for a developer of any position (entry-level to senior).
      Skills: ${JSON.stringify(categorizedSkills)}.
      Projects: ${JSON.stringify(bestProjects)}.
      Work Experience: ${JSON.stringify(workExperience || [])}.
      Education: ${education.degree ? `${education.degree}, ${education.institution} (${education.year || education.dates})` : "Not provided"}.
      Output plain JSON (no Markdown or code blocks): { summary: "string", enhancedExperience: [array of enhanced entries with quantifiable achievements] }
    `;
    const result = await safeGenerateContent(prompt);
    let aiOutputText = result.response.text().replace(/```json\n|\n```/g, "").trim();
    const aiOutput = JSON.parse(aiOutputText);

    res.json({
      githubUser,
      categorizedSkills,
      bestProjects,
      summary: aiOutput.summary,
      workExperience: aiOutput.enhancedExperience || workExperience,
      education: education.degree ? `${education.degree}, ${education.institution} (${education.year || education.dates})` : "Not provided",
    });
  } catch (error) {
    console.error("Error in /api/process-data:", error);
    res.status(500).json({ error: error.message || "Data processing failed" });
  }
});

// Export PDF (updated to include categorized skills and projects)
app.post("/api/export-pdf", async (req, res) => {
  const { githubUser, categorizedSkills, bestProjects, summary, workExperience, template, education } = req.body;
  const html = getResumeHTML({ githubUser, categorizedSkills, bestProjects, summary, workExperience, education }, template);
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=${githubUser}_resume.pdf`,
  });
  res.send(pdfBuffer);
});

// Export DOCX (updated structure)
app.post("/api/export-docx", async (req, res) => {
  const { githubUser, categorizedSkills, bestProjects, summary, workExperience, education } = req.body;
  const doc = new Document({
    sections: [
      {
        properties: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
        children: [
          new Paragraph({ text: `${githubUser}'s Resume`, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
          new Paragraph({ text: summary || "No summary available", spacing: { line: 276 } }),
          new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          ...Object.entries(categorizedSkills).flatMap(([category, items]) => [
            new Paragraph({ text: `${category}:`, spacing: { line: 276 } }),
            ...items.map((s) => new Paragraph({ text: s, spacing: { line: 276 } })),
          ]),
          new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          ...bestProjects.map((p) => new Paragraph({ text: `${p.name} - ${p.description} (Stars: ${p.stars})`, spacing: { line: 276 } })),
          new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          ...workExperience.flatMap((exp) => [
            new Paragraph({ text: `${exp.title} at ${exp.company} (${exp.dates})`, spacing: { line: 276 } }),
            new Paragraph({ text: exp.description || "No description", spacing: { line: 276 } }),
          ]),
          new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          new Paragraph({ text: education || "Not provided", spacing: { line: 276 } }),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  res.set({
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename=${githubUser}_resume.docx`,
  });
  res.send(buffer);
});

// Export Portfolio ZIP (updated)
app.post("/api/export-portfolio", async (req, res) => {
  const { githubUser, categorizedSkills, bestProjects, summary, workExperience, education, template } = req.body;
  const portfolioHTML = getPortfolioHTML({ githubUser, categorizedSkills, bestProjects, summary, workExperience, education }, template);
  const zip = new JSZip();
  zip.file("index.html", portfolioHTML);
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  res.set({
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename=portfolio.zip`,
  });
  res.send(zipBuffer);
});

// Helper: Get Resume HTML (categorized skills, projects)
function getResumeHTML(data, template) {
  const styles = {
    Minimal: `
      body { font-family: Arial, sans-serif; padding: 20px; background: #fff; color: #333; max-width: 800px; margin: 0 auto; }
      h1 { text-align: center; margin-bottom: 20px; }
      h2 { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px; }
      h3 { margin-top: 15px; font-size: 1.1em; }
      ul { list-style-type: disc; padding-left: 20px; }
      li { margin-bottom: 5px; }
      .section { margin-bottom: 20px; }
      .project { margin-bottom: 15px; }
      .project strong { display: block; }
      a { color: #007bff; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .placeholder { color: #888; font-style: italic; }
    `,
    "ATS-friendly": `
      :root {
        --page-width: 900px;
        --accent: #2f5668;
        --muted: #6b6b6b;
        --line: #d6d6d6;
        --bg: #f7f9f9;
        --text: #111;
        --section-gap: 22px;
      }
      body {
        font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
        margin: 0;
        padding: 28px 36px;
        max-width: var(--page-width);
      }
      .resume {
        background: #fff;
        box-shadow: 0 6px 20px rgba(18,18,18,0.06);
        border-radius: 6px;
        border-top: 6px solid #e9efef;
        padding: 28px 36px;
      }
      .header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 8px;
      }
      .name-block { flex: 1 1 auto; }
      .name {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        margin: 0;
      }
      .headline { margin: 4px 0 0; font-size: 13px; color: var(--muted); }
      .contact { min-width: 240px; text-align: right; font-size: 13px; color: var(--muted); }
      .contact a { color: var(--accent); text-decoration: none; }
      .contact a:hover { text-decoration: underline; }
      .rule { height: 1px; background: var(--line); margin: 18px 0; border-radius: 1px; }
      .section { padding: 8px 0 0; margin-bottom: var(--section-gap); }
      .section-title {
        font-size: 12px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 10px 0;
      }
      .section-title::before {
        content: "";
        height: 1px;
        flex: 1;
        background: var(--line);
      }
      .section-title span {
        white-space: nowrap;
        padding: 6px 10px;
        background: #fff;
        margin-left: -6px;
      }
      .item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; width: 100%; }
      .item-left { flex: 1 1 auto; }
      .item-title { font-weight: 700; font-size: 14px; margin: 0 0 4px 0; }
      .item-sub { color: var(--muted); font-size: 13px; margin: 0 0 6px 0; }
      .item-date { min-width: 160px; text-align: right; color: var(--muted); font-size: 13px; white-space: nowrap; }
      .skills {
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 8px 20px;
        font-size: 13px;
        color: var(--muted);
      }
      .skill-row { display: flex; gap: 8px; align-items: flex-start; }
      .skill-label { width: 120px; font-weight: 600; color: var(--text); font-size: 13px; }
      .skill-values { flex: 1; }
      ul.bullets { margin: 8px 0 14px 18px; padding: 0; color: var(--muted); font-size: 13px; }
      ul.bullets li { margin: 6px 0; line-height: 1.45; }
      .link { color: var(--accent); text-decoration: none; font-weight: 600; font-size: 13px; }
      .placeholder { color: var(--muted); font-style: italic; }
      @media (max-width: 720px) {
        .contact { text-align: left; min-width: 0; margin-top: 10px; }
        .header { flex-direction: column; align-items: flex-start; }
        .skills { grid-template-columns: 1fr; }
        .item-date { text-align: left; min-width: 0; }
      }
    `,
    Modern: `
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f8f9fa; padding: 40px; color: #212529; max-width: 900px; margin: 0 auto; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
      h1 { text-align: center; color: #007bff; margin-bottom: 30px; font-size: 2em; }
      h2 { color: #343a40; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-top: 40px; font-size: 1.5em; }
      h3 { color: #495057; margin-top: 20px; font-size: 1.2em; }
      ul { list-style-type: none; padding-left: 0; display: flex; flex-wrap: wrap; gap: 10px; }
      li { background: #e9ecef; padding: 5px 10px; border-radius: 4px; }
      .section { margin-bottom: 30px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
      .project { margin-bottom: 20px; border-left: 4px solid #007bff; padding-left: 15px; }
      .project strong { font-size: 1.1em; color: #007bff; }
      a { color: #007bff; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .placeholder { color: #6c757d; font-style: italic; }
    `,
  };

  const { githubUser, categorizedSkills, bestProjects, summary, workExperience, education } = data;

  // Construct education string with optional GPA
  const educationString = education.degree
    ? `${education.degree}, ${education.institution} (${education.dates || education.year})${education.gpa ? `; GPA: ${education.gpa}` : ''}`
    : '<span class="placeholder">Edit here: Add education</span>';

  let html = `<html><head><style>${styles[template] || styles.Minimal}</style></head><body><div class="resume">`;

  // Header
  html += `
    <div class="header">
      <div class="name-block">
        <h1 class="name">${githubUser || 'Your Name'}</h1>
        <div class="headline">Software Developer</div>
      </div>
      <div class="contact">
        <div><a href="https://github.com/${githubUser}" aria-label="GitHub">GitHub</a></div>
        <div class="small">Email: example@email.com</div>
        <div class="small">Mobile: +91 1234567890</div>
      </div>
    </div>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Summary
  html += `
    <section class="section" aria-label="Summary">
      <div class="section-title"><span>SUMMARY</span></div>
      <p>${summary || '<span class="placeholder">Edit here: Add summary</span>'}</p>
    </section>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Skills
  html += `
    <section class="section" aria-label="Skills">
      <div class="section-title"><span>SKILLS SUMMARY</span></div>
      <div class="skills" role="list">
        ${Object.entries(categorizedSkills).map(([category, items]) => `
          <div class="skill-row" role="listitem">
            <div class="skill-label">${category}:</div>
            <div class="skill-values">${items.length ? items.join(', ') : '<span class="placeholder">No items</span>'}</div>
          </div>
        `).join('')}
      </div>
    </section>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Projects
  html += `
    <section class="section" aria-label="Projects">
      <div class="section-title"><span>PROJECTS</span></div>
      ${bestProjects.length ? bestProjects.map((p) => `
        <div class="item">
          <div class="item-left">
            <p class="item-title"><a class="link" href="${p.html_url}" aria-label="${p.name}">${p.name}</a></p>
            <ul class="bullets">
              ${p.description.split('\n').filter(line => line.startsWith('- ')).map(line => `<li>${line.slice(2)}</li>`).join('') || '<li>No description available</li>'}
            </ul>
          </div>
          <div class="item-date">${new Date(p.created_at).toLocaleString('default', { month: 'short', year: 'numeric' })} — ${new Date(p.pushed_at).toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
        </div>
      `).join('') : '<p class="placeholder">Edit here: Add projects</p>'}
    </section>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Work Experience
  html += `
    <section class="section" aria-label="Work Experience">
      <div class="section-title"><span>WORK EXPERIENCE</span></div>
      ${workExperience.length ? workExperience.map((exp) => `
        <div class="item">
          <div class="item-left">
            <p class="item-title">${exp.title} <span style="font-weight:600; color:var(--accent); font-size:13px;">| ${exp.company}</span></p>
            <p class="item-sub">${exp.description}</p>
          </div>
          <div class="item-date">${exp.dates}</div>
        </div>
      `).join('') : '<p class="placeholder">Edit here: Add experience</p>'}
    </section>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Education
  html += `
    <section class="section" aria-label="Education">
      <div class="section-title"><span>EDUCATION</span></div>
      <div class="item">
        <div class="item-left">
          <p class="item-title">${education.degree || 'Degree'}</p>
          <p class="item-sub">${education.institution}${education.gpa ? `; GPA: ${education.gpa}` : ''}</p>
        </div>
        <div class="item-date">${education.dates || education.year || 'Dates'}</div>
      </div>
    </section>
  `;

  html += `</div></body></html>`;
  return html;
}

// Update getPortfolioHTML to align with the new ATS-friendly template
function getPortfolioHTML(data, template) {
  const styles = {
    Minimal: `
      body { font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; color: #333; max-width: 1200px; margin: 0 auto; }
      h1 { text-align: center; margin-bottom: 20px; }
      h2 { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px; }
      h3 { margin-top: 15px; font-size: 1.1em; }
      ul { list-style-type: disc; padding-left: 20px; }
      li { margin-bottom: 5px; }
      .section { margin-bottom: 20px; }
      .project { margin-bottom: 15px; }
      .project strong { display: block; }
      a { color: #007bff; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .placeholder { color: #888; font-style: italic; }
      footer { text-align: center; margin-top: 40px; color: #666; }
    `,
    "ATS-friendly": `
      :root {
        --page-width: 1200px;
        --accent: #2f5668;
        --muted: #6b6b6b;
        --line: #d6d6d6;
        --bg: #f7f9f9;
        --text: #111;
        --section-gap: 22px;
      }
      body {
        font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: var(--bg);
        color: var(--text);
        margin: 0;
        padding: 28px 36px;
        max-width: var(--page-width);
      }
      .resume {
        background: #fff;
        box-shadow: 0 6px 20px rgba(18,18,18,0.06);
        border-radius: 6px;
        border-top: 6px solid #e9efef;
        padding: 28px 36px;
      }
      .header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 8px;
      }
      .name-block { flex: 1 1 auto; }
      .name {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        margin: 0;
      }
      .headline { margin: 4px 0 0; font-size: 13px; color: var(--muted); }
      .contact { min-width: 240px; text-align: right; font-size: 13px; color: var(--muted); }
      .contact a { color: var(--accent); text-decoration: none; }
      .contact a:hover { text-decoration: underline; }
      .rule { height: 1px; background: var(--line); margin: 18px 0; border-radius: 1px; }
      .section { padding: 8px 0 0; margin-bottom: var(--section-gap); }
      .section-title {
        font-size: 12px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0 0 10px 0;
      }
      .section-title::before {
        content: "";
        height: 1px;
        flex: 1;
        background: var(--line);
      }
      .section-title span {
        white-space: nowrap;
        padding: 6px 10px;
        background: #fff;
        margin-left: -6px;
      }
      .item { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; width: 100%; }
      .item-left { flex: 1 1 auto; }
      .item-title { font-weight: 700; font-size: 14px; margin: 0 0 4px 0; }
      .item-sub { color: var(--muted); font-size: 13px; margin: 0 0 6px 0; }
      .item-date { min-width: 160px; text-align: right; color: var(--muted); font-size: 13px; white-space: nowrap; }
      .skills {
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 8px 20px;
        font-size: 13px;
        color: var(--muted);
      }
      .skill-row { display: flex; gap: 8px; align-items: flex-start; }
      .skill-label { width: 120px; font-weight: 600; color: var(--text); font-size: 13px; }
      .skill-values { flex: 1; }
      ul.bullets { margin: 8px 0 14px 18px; padding: 0; color: var(--muted); font-size: 13px; }
      ul.bullets li { margin: 6px 0; line-height: 1.45; }
      .link { color: var(--accent); text-decoration: none; font-weight: 600; font-size: 13px; }
      .placeholder { color: var(--muted); font-style: italic; }
      footer { text-align: center; margin-top: 60px; color: var(--muted); font-size: 0.9em; }
      @media (max-width: 720px) {
        .contact { text-align: left; min-width: 0; margin-top: 10px; }
        .header { flex-direction: column; align-items: flex-start; }
        .skills { grid-template-columns: 1fr; }
        .item-date { text-align: left; min-width: 0; }
      }
    `,
    Modern: `
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: linear-gradient(to bottom, #f8f9fa, #e9ecef); padding: 60px 20px; color: #212529; max-width: 1200px; margin: 0 auto; }
      h1 { text-align: center; color: #007bff; margin-bottom: 40px; font-size: 2.5em; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
      h2 { color: #343a40; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-top: 50px; font-size: 1.8em; }
      h3 { color: #495057; margin-top: 25px; font-size: 1.3em; }
      ul { list-style-type: none; padding-left: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
      li { background: #fff; padding: 10px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center; }
      .section { margin-bottom: 40px; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
      .project { margin-bottom: 25px; border-left: 6px solid #007bff; padding-left: 20px; background: #f8f9fa; padding: 15px; border-radius: 6px; }
      .project strong { font-size: 1.2em; color: #007bff; display: block; }
      a { color: #007bff; text-decoration: none; font-weight: bold; }
      a:hover { text-decoration: underline; color: #0056b3; }
      .placeholder { color: #6c757d; font-style: italic; }
      footer { text-align: center; margin-top: 60px; color: #6c757d; font-size: 0.9em; }
    `,
  };

  const { githubUser, categorizedSkills, bestProjects, summary, workExperience, education } = data;

  // Construct education string with optional GPA
  const educationString = education.degree
    ? `${education.degree}, ${education.institution} (${education.dates || education.year})${education.gpa ? `; GPA: ${education.gpa}` : ''}`
    : '<span class="placeholder">Edit here: Add education</span>';

  let html = `<html><head><title>${githubUser}'s Portfolio</title><style>${styles[template] || styles.Minimal}</style></head><body><div class="resume">`;

  // Header
  html += `
    <div class="header">
      <div class="name-block">
        <h1 class="name">${githubUser || 'Your Name'}</h1>
        <div class="headline">Software Developer</div>
      </div>
      <div class="contact">
        <div><a href="https://github.com/${githubUser}" aria-label="GitHub">GitHub</a></div>
        <div class="small">Email: example@email.com</div>
        <div class="small">Mobile: +91 1234567890</div>
      </div>
    </div>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Summary
  html += `
    <section class="section" aria-label="Summary">
      <div class="section-title"><span>SUMMARY</span></div>
      <p>${summary || '<span class="placeholder">Edit here: Add summary</span>'}</p>
    </section>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Skills
  html += `
    <section class="section" aria-label="Skills">
      <div class="section-title"><span>SKILLS SUMMARY</span></div>
      <div class="skills" role="list">
        ${Object.entries(categorizedSkills).map(([category, items]) => `
          <div class="skill-row" role="listitem">
            <div class="skill-label">${category}:</div>
            <div class="skill-values">${items.length ? items.join(', ') : '<span class="placeholder">No items</span>'}</div>
          </div>
        `).join('')}
      </div>
    </section>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Projects
  html += `
    <section class="section" aria-label="Projects">
      <div class="section-title"><span>PROJECTS</span></div>
      ${bestProjects.length ? bestProjects.map((p) => `
        <div class="item">
          <div class="item-left">
            <p class="item-title"><a class="link" href="${p.html_url}" aria-label="${p.name}">${p.name}</a> (${p.language}) ⭐ ${p.stargazers_count}</p>
            <ul class="bullets">
              ${p.description.split('\n').filter(line => line.startsWith('- ')).map(line => `<li>${line.slice(2)}</li>`).join('') || '<li>No description available</li>'}
            </ul>
          </div>
          <div class="item-date">${new Date(p.created_at).toLocaleString('default', { month: 'short', year: 'numeric' })} — ${new Date(p.pushed_at).toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
        </div>
      `).join('') : '<p class="placeholder">Edit here: Add projects</p>'}
    </section>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Work Experience
  html += `
    <section class="section" aria-label="Work Experience">
      <div class="section-title"><span>WORK EXPERIENCE</span></div>
      ${workExperience.length ? workExperience.map((exp) => `
        <div class="item">
          <div class="item-left">
            <p class="item-title">${exp.title} <span style="font-weight:600; color:var(--accent); font-size:13px;">| ${exp.company}</span></p>
            <p class="item-sub">${exp.description}</p>
          </div>
          <div class="item-date">${exp.dates}</div>
        </div>
      `).join('') : '<p class="placeholder">Edit here: Add experience</p>'}
    </section>
    <div class="rule" aria-hidden="true"></div>
  `;

  // Education
  html += `
    <section class="section" aria-label="Education">
      <div class="section-title"><span>EDUCATION</span></div>
      <div class="item">
        <div class="item-left">
          <p class="item-title">${education.degree || 'Degree'}</p>
          <p class="item-sub">${education.institution}${education.gpa ? `; GPA: ${education.gpa}` : ''}</p>
        </div>
        <div class="item-date">${education.dates || education.year || 'Dates'}</div>
      </div>
    </section>
  `;

  html += `<footer><p>Generated Portfolio - Edit placeholders and regenerate.</p></footer></div></body></html>`;
  return html;
}

// Helper: Get Portfolio HTML (similar updates)
function getPortfolioHTML(data, template) {
  const styles = {
    Minimal: `
      body { font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; color: #333; max-width: 1200px; margin: 0 auto; }
      h1 { text-align: center; margin-bottom: 20px; }
      h2 { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px; }
      h3 { margin-top: 15px; font-size: 1.1em; }
      ul { list-style-type: disc; padding-left: 20px; }
      li { margin-bottom: 5px; }
      .section { margin-bottom: 20px; }
      .project { margin-bottom: 15px; }
      .project strong { display: block; }
      a { color: #007bff; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .placeholder { color: #888; font-style: italic; }
      footer { text-align: center; margin-top: 40px; color: #666; }
    `,
    "ATS-friendly": `
      body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; margin: 1in; color: #000; background: #fff; max-width: 8.5in; }
      h1 { font-size: 14pt; font-weight: bold; margin-bottom: 10pt; text-align: left; }
      h2 { font-size: 12pt; font-weight: bold; margin-top: 20pt; margin-bottom: 5pt; }
      h3 { font-size: 11pt; font-weight: bold; margin-top: 10pt; margin-bottom: 3pt; }
      ul { list-style-type: disc; margin-left: 20pt; padding-left: 0; }
      li { margin-bottom: 5pt; }
      p { margin-bottom: 10pt; }
      .placeholder { color: #666; font-style: italic; }
      .section { margin-bottom: 15pt; }
      .project { margin-bottom: 10pt; }
      a { color: #000; text-decoration: underline; }
      footer { margin-top: 20pt; font-size: 10pt; color: #666; }
    `,
    Modern: `
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: linear-gradient(to bottom, #f8f9fa, #e9ecef); padding: 60px 20px; color: #212529; max-width: 1200px; margin: 0 auto; }
      h1 { text-align: center; color: #007bff; margin-bottom: 40px; font-size: 2.5em; text-shadow: 1px 1px 2px rgba(0,0,0,0.1); }
      h2 { color: #343a40; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-top: 50px; font-size: 1.8em; }
      h3 { color: #495057; margin-top: 25px; font-size: 1.3em; }
      ul { list-style-type: none; padding-left: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
      li { background: #fff; padding: 10px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center; }
      .section { margin-bottom: 40px; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
      .project { margin-bottom: 25px; border-left: 6px solid #007bff; padding-left: 20px; background: #f8f9fa; padding: 15px; border-radius: 6px; }
      .project strong { font-size: 1.2em; color: #007bff; display: block; }
      a { color: #007bff; text-decoration: none; font-weight: bold; }
      a:hover { text-decoration: underline; color: #0056b3; }
      .placeholder { color: #6c757d; font-style: italic; }
      footer { text-align: center; margin-top: 60px; color: #6c757d; font-size: 0.9em; }
    `,
  };
  const { githubUser, categorizedSkills, bestProjects, summary, workExperience, education } = data;
  let html = `<html><head><title>${githubUser}'s Portfolio</title><style>${styles[template] || styles.Minimal}</style></head><body>`;
  html += `<h1>${githubUser}'s Portfolio</h1>`;
  html += `<div class="section"><p>${summary || '<span class="placeholder">Edit here: Add summary</span>'}</p></div>`;
  html += `<div class="section"><h2>Skills</h2>`;
  Object.entries(categorizedSkills).forEach(([category, items]) => {
    html += `<h3>${category}</h3><ul>${items.length ? items.map((s) => `<li>${s}</li>`).join("") : '<li class="placeholder">No items</li>'}</ul>`;
  });
  html += `</div>`;
  html += `<div class="section"><h2>Projects</h2>${bestProjects.length ? bestProjects.map((p) => `<div class="project"><strong><a href="${p.html_url}">${p.name}</a></strong> (${p.language}) ⭐ ${p.stargazers_count}<br>${p.description.replace(/\n/g, '<br>')}</div>`).join("") : '<p class="placeholder">Edit here: Add projects</p>'}</div>`;
  html += `<div class="section"><h2>Experience</h2>${workExperience.length ? workExperience.map((exp) => `<div class="experience"><strong>${exp.title} at ${exp.company}</strong> (${exp.dates})<br>${exp.description}</div>`).join("") : '<p class="placeholder">Edit here: Add experience</p>'}</div>`;
  html += `<div class="section"><h2>Education</h2><p>${education || '<span class="placeholder">Edit here: Add education</span>'}</p></div>`;
  html += `<footer><p>Generated Portfolio - Edit placeholders and regenerate.</p></footer></body></html>`;
  return html;
}

const PORT = 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT} at 01:16 AM IST, September 11, 2025`));