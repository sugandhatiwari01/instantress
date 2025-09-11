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

    // Select 2 Best Projects (prioritize full-stack, descriptions, recency)
 // Inside the /api/process-data endpoint, replace the fallback logic
// Select 2 Best Projects (prioritize full-stack, descriptions, recency)
const bestProjects = repos
  .filter(r => !r.fork) // ignore forks
  .sort((a, b) => {
    const scoreA =
      (a.description?.toLowerCase().includes("app") || a.description?.toLowerCase().includes("portal") ? 10 : 0) +
      (["JavaScript", "Python", "Java"].includes(a.language) ? 5 : 0) +
      a.stargazers_count;
    const scoreB =
      (b.description?.toLowerCase().includes("app") || b.description?.toLowerCase().includes("portal") ? 10 : 0) +
      (["JavaScript", "Python", "Java"].includes(b.language) ? 5 : 0) +
      b.stargazers_count;
    return scoreB - scoreA;
  })
  .slice(0, 2)
  .map(r => ({
    name: r.name,
    description: r.description || "No description provided",
    url: r.html_url,
    stars: r.stargazers_count,
    language: r.language || "Not specified",
  }));





    // Gemini Prompt (general for any position)

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
          new Paragraph(summary || "No summary available", 'spacing: { line: 276 }'),
          new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          ...Object.entries(categorizedSkills).flatMap(([category, items]) => [
            new Paragraph(`${category}:`, 'spacing: { line: 276 }'),
            ...items.map((s) => new Paragraph(new TextRun(s), 'spacing: { line: 276 }')),
          ]),
          new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          ...bestProjects.map((p) => new Paragraph(`${p.name} - ${p.description} (Stars: ${p.stars})`, 'spacing: { line: 276 }')),
          new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          ...workExperience.flatMap((exp) => [
            new Paragraph(`${exp.title} at ${exp.company} (${exp.dates})`, 'spacing: { line: 276 }'),
            new Paragraph(exp.description || "No description", 'spacing: { line: 276 }'),
          ]),
          new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
          new Paragraph(education || "Not provided", 'spacing: { line: 276 }'),
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
    Minimal: "body { font-family: Arial; padding: 20px; }",
    "ATS-friendly": `
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.15;
        margin: 1in;
        color: #000;
        background: #fff;
      }
      h1 { font-size: 14pt; font-weight: bold; margin-bottom: 10pt; }
      h2 { font-size: 12pt; font-weight: bold; margin-top: 20pt; margin-bottom: 5pt; }
      h3 { font-size: 11pt; font-weight: bold; margin-top: 10pt; margin-bottom: 3pt; }
      ul { list-style-type: disc; margin-left: 20pt; padding-left: 0; }
      li { margin-bottom: 5pt; }
      .placeholder { color: #666; font-style: italic; }
    `,
    Modern: "body { font-family: Helvetica; background: #f4f4f4; padding: 30px; }",
  };
  const { githubUser, categorizedSkills, bestProjects, summary, workExperience, education } = data;
  let html = `<html><head><style>${styles[template] || styles.Minimal}</style></head><body>`;
  html += `<h1>${githubUser}'s Resume</h1>`;
  html += `<p>${summary || '<span class="placeholder">Edit here: Add summary</span>'}</p>`;
  html += `<h2>Skills</h2>`;
  Object.entries(categorizedSkills).forEach(([category, items]) => {
    html += `<h3>${category}</h3><ul>${items.length ? items.map((s) => `<li>${s}</li>`).join("") : '<li class="placeholder">No items</li>'}</ul>`;
  });
  html += `<h2>Projects</h2>${bestProjects.length ? bestProjects.map((p) => `<p><strong>${p.name}</strong> - ${p.description} (<a href="${p.url}">Link</a>, Stars: ${p.stars})</p>`).join("") : '<p class="placeholder">Edit here: Add projects</p>'}`;
  html += `<h2>Experience</h2>${workExperience.length ? workExperience.map((exp) => `<p><strong>${exp.title} at ${exp.company}</strong> (${exp.dates})<br>${exp.description}</p>`).join("") : '<p class="placeholder">Edit here: Add experience</p>'}`;
  html += `<h2>Education</h2><p>${education || '<span class="placeholder">Edit here: Add education</span>'}</p>`;
  html += "</body></html>";
  return html;
}

// Helper: Get Portfolio HTML (similar updates)
function getPortfolioHTML(data, template) {
  const styles = {
    Minimal: "body { font-family: Arial; padding: 20px; background: #f9f9f9; }",
    "ATS-friendly": `
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.15;
        margin: 1in;
        color: #000;
        background: #fff;
      }
      h1 { font-size: 14pt; font-weight: bold; margin-bottom: 10pt; }
      h2 { font-size: 12pt; font-weight: bold; margin-top: 20pt; margin-bottom: 5pt; }
      h3 { font-size: 11pt; font-weight: bold; margin-top: 10pt; margin-bottom: 3pt; }
      ul { list-style-type: disc; margin-left: 20pt; padding-left: 0; }
      li { margin-bottom: 5pt; }
      .placeholder { color: #666; font-style: italic; }
      footer { margin-top: 20pt; font-size: 10pt; color: #666; }
    `,
    Modern: "body { font-family: Helvetica; background: #e9ecef; padding: 30px; }",
  };
  const { githubUser, categorizedSkills, bestProjects, summary, workExperience, education } = data;
  let html = `<html><head><title>${githubUser}'s Portfolio</title><style>${styles[template] || styles.Minimal}</style></head><body>`;
  html += `<h1>${githubUser}'s Portfolio</h1>`;
  html += `<p>${summary || '<span class="placeholder">Edit here: Add summary</span>'}</p>`;
  html += `<h2>Skills</h2>`;
  Object.entries(categorizedSkills).forEach(([category, items]) => {
    html += `<h3>${category}</h3><ul>${items.length ? items.map((s) => `<li>${s}</li>`).join("") : '<li class="placeholder">No items</li>'}</ul>`;
  });
  html += `<h2>Projects</h2>${bestProjects.length ? bestProjects.map((p) => `<p><strong><a href="${p.url}">${p.name}</a></strong> (${p.language}) ⭐ ${p.stars}<br>${p.description}</p>`).join("") : '<p class="placeholder">Edit here: Add projects</p>'}`;
  html += `<h2>Experience</h2>${workExperience.length ? workExperience.map((exp) => `<p><strong>${exp.title} at ${exp.company}</strong> (${exp.dates})<br>${exp.description}</p>`).join("") : '<p class="placeholder">Edit here: Add experience</p>'}`;
  html += `<h2>Education</h2><p>${education || '<span class="placeholder">Edit here: Add education</span>'}</p>`;
  html += `<footer><p>Generated Portfolio - Edit placeholders and regenerate.</p></footer></body></html>`;
  return html;
}

const PORT = 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT} at 01:16 AM IST, September 11, 2025`));