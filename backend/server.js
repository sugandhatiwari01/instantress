require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const { Document, Packer, Paragraph, HeadingLevel } = require("docx");
const JSZip = require("jszip");

const app = express();
app.use(cors());  // Allow all origins in development
app.use(bodyParser.json());

// Check optional GitHub token and define githubAuthHeader
const githubAuthHeader = process.env.GITHUB_TOKEN
  ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
  : {};
if (!process.env.GITHUB_TOKEN) {
  console.warn("Warning: GITHUB_TOKEN not provided. You may hit GitHub API rate limits.");
}

// Initialize Groq client
let groqClient = null;
// Allow forcing local-only generation using USE_REMOTE_AI=false in .env
const useRemoteAI = process.env.USE_REMOTE_AI !== 'false';

// Define available Groq models
const GROQ_MODELS = {
  DEFAULT: 'llama-3.1-8b-instant',  // Using Mixtral as default
  FALLBACK: 'llama2-70b-4096',    // Fallback model
};

if (process.env.GROQ_API_KEY && useRemoteAI) {
  try {
    if (!process.env.GROQ_API_KEY.startsWith('gsk_')) {
      throw new Error('Invalid GROQ_API_KEY format. Should start with "gsk_"');
    }
    
    groqClient = axios.create({
      baseURL: "https://api.groq.com/openai/v1",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });
    
    // Test the connection immediately
    console.log("Testing Groq connection...");
    groqClient.post("/chat/completions", {
      model: GROQ_MODELS.DEFAULT,
      messages: [{ role: "system", content: "Test connection" }],
    }).then(() => {
      console.log("✓ Groq client ready and tested successfully");
    }).catch(err => {
      console.error("× Groq connection test failed:", err.message);
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
      }
    });
  } catch (e) {
    console.error("× Groq init failed:", e.message);
    console.error("Stack trace:", e.stack);
    groqClient = null;
  }
} else {
  if (!useRemoteAI) console.log("× USE_REMOTE_AI=false — forcing local content generation");
  else console.error("× No GROQ_API_KEY set. Falling back to local content generation.");
}

// Local fallback generator
async function localGenerateContent({ contents }) {
  try {
    const raw = (contents || []).map(c => (c.parts || []).map(p => p.text).join(" ")).join(" ");
    if (/output plain json/i.test(raw) || /output JSON/i.test(raw)) {
      const skillsMatch = raw.match(/Skills:\s*([^\.\n]+)/i);
      const projectsMatch = raw.match(/Projects:\s*([^\.\n]+)/i);
      const workMatch = raw.match(/Work Experience:\s*([^\.\n]+)/i);
      const educationMatch = raw.match(/Education:\s*([^\.\n]+)/i);

      const skills = skillsMatch ? skillsMatch[1].trim().split(",").map(s => s.trim()) : ["JavaScript"];
      const projects = projectsMatch
        ? JSON.parse(projectsMatch[1].trim()).map(p => p.name)
        : ["bookstore"];
      const work = workMatch ? workMatch[1].trim() : "no prior work experience";
      const education = educationMatch ? educationMatch[1].trim() : "pursuing relevant education";

      const summary = `A motivated developer skilled in ${skills.join(", ") || "modern technologies"}. Developed projects such as ${projects.join(" and ") || "a bookstore application"}. ${work ? `Gained experience through ${work}.` : "Eager to apply skills in professional settings."} Educated in ${education}.`;
      const enhancedExperience = work
        ? [{ title: "Professional Experience", description: work, achievements: ["Contributed to project development"] }]
        : [];
      return JSON.stringify({ summary, enhancedExperience });
    }
    const firstSentence = raw.split(/[\.\n]/).find(s => s.trim().length > 20) || raw.slice(0, 120);
    return `Summary: ${firstSentence.trim()}`;
  } catch (err) {
    console.warn("localGenerateContent failed:", err?.message);
    return JSON.stringify({
      summary: "A developer with experience in JavaScript projects like bookstore. Seeking opportunities to grow.",
      enhancedExperience: [],
    });
  }
}

// Safe generate content with retries
async function safeGenerateContent({ model, contents, generationConfig = {} }, retries = 3, delay = 2000) {
  if (!groqClient) {
    console.warn("Groq client not initialized - using local fallback");
    return await localGenerateContent({ contents, model });
  }
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting Groq API call (attempt ${i + 1}) with model:`, model);
      const payload = {
        model: model || GROQ_MODELS.DEFAULT,
        messages: contents.map(c => ({ role: c.role, content: c.parts[0].text })),
        temperature: generationConfig.temperature || 0.5,
        max_tokens: generationConfig.max_tokens || 512,
        stream: false, // Explicitly disable streaming
      };
      const result = await groqClient.post("/chat/completions", payload);
      console.log("Groq API call successful");
      return result.data.choices[0].message.content;
    } catch (err) {
      console.warn(`Groq API call failed (attempt ${i + 1}):`, err.message);
      console.error("Full error:", JSON.stringify(err, null, 2));
      if (err.response?.status === 400) {
        console.error("Bad request - likely invalid payload or prompt too long.");
        return await localGenerateContent({ contents, model });
      }
      if (err.response?.status === 429) {
        console.warn("Rate limit hit, waiting longer...");
        await new Promise(res => setTimeout(res, delay * (i + 1) * 2));
      }
      if (i === retries - 1) {
        console.error("All retries failed for Groq API.");
        return await localGenerateContent({ contents, model });
      }
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
  return await localGenerateContent({ contents, model });
}

// Test Groq connectivity
app.get("/api/test-grok", async (req, res) => {
  if (!groqClient) return res.status(400).json({ error: "Groq client not configured. Set GROQ_API_KEY." });
  try {
    const result = await groqClient.post("/chat/completions", {
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: "Say hello and report model status" }],
      temperature: 0,
    });
    res.json({ ok: true, text: result.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || err, details: err });
  }
});

// Summarize README
async function summarizeReadme(repoName, readmeText) {
  const prompt = `
Summarize the GitHub project README in 2-3 technical bullet points focusing on features, technologies, and achievements. Keep it concise, avoid marketing language.

Project: ${repoName}
README: ${readmeText.slice(0, 1000)}... (truncated for brevity)
`;
  try {
    const summary = await safeGenerateContent({
      model: "llama3-8b-8192",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, max_tokens: 256 },
    });
    return summary ? summary.trim() : readmeText.split("\n").slice(0, 3).join(" ") || "No description available";
  } catch (err) {
    console.error(`Error summarizing README for ${repoName}:`, err.message);
    return readmeText.split("\n").slice(0, 3).join(" ") || "No description available";
  }
}

// Fetch repo languages
async function fetchRepoLanguages(owner, repo) {
  try {
    const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`, {
      headers: { Accept: "application/vnd.github.v3+json", ...githubAuthHeader },
    });
    return Object.keys(res.data);
  } catch (err) {
    console.warn(`Error fetching languages for ${owner}/${repo}:`, err.message);
    if (err.response?.status === 403) {
      console.warn("Rate limit exceeded for languages API");
    }
    return [];
  }
}

// Language scoring function
function getLanguageScore(languages) {
  let score = 0;
  languages.forEach(lang => {
    const l = lang.toLowerCase();
    if (/typescript|react|next|node|django|spring|rust|go|kotlin|swift|scala/.test(l)) score += 10;
    else if (/java|c\+\+|c#|python|php/.test(l)) score += 7;
    else if (/html|css|markdown|shell|sql/.test(l)) score += 3;
    else score += 5;
  });
  return score;
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input.replace(/[<>"'&]/g, match => ({
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "&": "&amp;",
  })[match]);
}

// Process Data Endpoint
app.post("/api/process-data", async (req, res) => {
  try {
    console.log("Received request body:", JSON.stringify(req.body, null, 2));
    const { githubUsername, leetcodeUser, workExperience = [], education = {}, contactInfo = {}, customSections = {}, template = "ATS-friendly" } = req.body;
    console.log("Parsed request data:", { githubUsername, leetcodeUser, template });

    if (!githubUsername) {
      return res.status(400).json({ error: "GitHub username is required" });
    }

    // Validate customSections
    for (const [title, section] of Object.entries(customSections)) {
      if (!section.content && !section.items) {
        return res.status(400).json({ error: `Invalid format for section ${title}: must have content or items` });
      }
      if (section.items && !Array.isArray(section.items)) {
        return res.status(400).json({ error: `Items for section ${title} must be an array` });
      }
    }
    // Fetch GitHub repos with error handling
    let repos = [];
    try {
      const githubRes = await axios.get(`https://api.github.com/users/${githubUsername}/repos`, {
        headers: { Accept: "application/vnd.github.v3+json", ...githubAuthHeader },
      });
      if (!githubRes.data) throw new Error("GitHub user not found");
      repos = githubRes.data;
    } catch (error) {
      console.error("Error fetching GitHub repos:", error.message);
      if (error.response?.status === 403) {
        return res.status(429).json({ error: "GitHub API rate limit exceeded. Please try again later." });
      }
      if (error.response?.status === 404) {
        return res.status(404).json({ error: "GitHub user not found" });
      }
      return res.status(500).json({ error: "Failed to fetch GitHub data" });
    }

    let allLanguages = [...new Set(repos.map(r => r.language).filter(Boolean))];

    // LeetCode optional fetch
    let leetcodeLanguages = [];
    if (leetcodeUser) {
      try {
        const query = {
          query: `query getUserProfile($username: String!) { 
            matchedUser(username: $username) { 
              username 
              submitStats { acSubmissionNum { difficulty count } } 
              languageProblemCount { languageName count } 
            } 
          }`,
          variables: { username: leetcodeUser },
        };
        const lcRes = await axios.post("https://leetcode.com/graphql", query, {
          headers: { "Content-Type": "application/json" },
        });
        const lcData = lcRes.data?.data?.matchedUser;
        if (lcData) {
          if (lcData.submitStats?.acSubmissionNum?.find(s => s.difficulty === "Medium")?.count > 50) {
            leetcodeLanguages = ["C", "C++"];
          }
          if (lcData.languageProblemCount) {
            leetcodeLanguages = [...leetcodeLanguages, ...lcData.languageProblemCount.map(l => l.languageName)];
          }
        }
      } catch (err) {
        console.warn("LeetCode fetch failed:", err.message);
      }
    }
    allLanguages = [...new Set([...allLanguages, ...leetcodeLanguages])];

    // Categorize Skills
    const categorizedSkills = {
      "Programming Languages": ["JavaScript", "C", "C++", "PL/SQL"].filter(lang => allLanguages.includes(lang)),
      Frontend: ["HTML", "CSS", "React.js", "Bootstrap", "TailwindCSS"].filter(lang => allLanguages.includes(lang) || lang === "React.js"),
      Backend: ["Node.js", "Express.js", "MongoDB", "Firebase"].filter(lang => allLanguages.includes(lang) || lang === "MongoDB"),
      "Tools/Other": ["Git", "GitHub", "Figma", "Canva", "VSCode"].filter(lang => allLanguages.includes(lang)),
    };

    if (customSections.Skills) {
      categorizedSkills[customSections.Skills.title || "Skills"] = customSections.Skills.items || categorizedSkills["Programming Languages"];
      delete customSections.Skills;
    }

    // Process Projects with error handling
    const limitedRepos = (repos || []).filter(r => !r.fork).slice(0, 5);
    let allProjects = [];
    try {
      allProjects = await Promise.all(
        limitedRepos.map(async r => {
          try {
            const languages = await fetchRepoLanguages(githubUsername, r.name);
            const langScore = getLanguageScore(languages);
            const recencyScore = Math.max(0, 6 - (Date.now() - new Date(r.pushed_at)) / (1000 * 60 * 60 * 24 * 30));
            const descScore = r.description ? 3 : 0;
            const totalScore = langScore + recencyScore + descScore;
            let readmeSummary = r.description || "No description available";
            try {
              const readmeRes = await axios.get(
                `https://api.github.com/repos/${githubUsername}/${r.name}/readme`,
                { headers: { Accept: "application/vnd.github.v3.raw", ...githubAuthHeader } },
              );
              readmeSummary = await summarizeReadme(r.name, readmeRes.data);
            } catch (readmeErr) {
              console.warn(`Error fetching README for ${r.name}:`, readmeErr.message);
            }
            return { ...r, description: readmeSummary, score: totalScore };
          } catch (err) {
            console.warn(`Error processing repo ${r.name}:`, err.message);
            return { 
              ...r, 
              description: r.description || "No description available",
              score: 0
            };
          }
        })
      );
    } catch (err) {
      console.error("Error processing projects:", err.message);
      allProjects = limitedRepos.map(r => ({
        ...r,
        description: r.description || "No description available",
        score: 0
      }));
    }

    allProjects.sort((a, b) => b.score - a.score);
    let bestProjects = allProjects.slice(0, 2);

    if (customSections.Projects) {
      bestProjects = customSections.Projects.items || bestProjects;
      delete customSections.Projects;
    }

    // Prepare AI prompt for resume summary
    const educationString =
      customSections.Education?.content ||
      (education && education.degree
        ? `${education.degree}, ${education.institution || ""} (${education.dates || education.year || "Not provided"})`
        : "Not provided");

    const prompt = `
Generate a 3-5 sentence resume summary for a developer (entry-level to senior) based on:
- Skills: ${JSON.stringify(
      Object.fromEntries(
        Object.entries(categorizedSkills).map(([k, v]) => [k, v.slice(0, 5)]),
      ),
    )}
- Projects: ${JSON.stringify(
      bestProjects.map(p => ({
        name: p.name,
        description: p.description.slice(0, 200),
      })),
    )}
- Work: ${JSON.stringify(workExperience.slice(0, 2))}
- Education: ${educationString.slice(0, 100)}
Return JSON: { "summary": "string", "enhancedExperience": [array of {title, description, achievements}] }
`;

    let aiOutput = { summary: "", enhancedExperience: workExperience };
    if (!customSections.Summary) {
      const aiText = await safeGenerateContent({
        model: "llama3-8b-8192",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, max_tokens: 512 },
      });
      if (aiText) {
        try {
          aiOutput = JSON.parse(aiText);
        } catch (parseErr) {
          console.warn("Groq returned invalid JSON, using fallback:", parseErr.message);
          aiOutput = {
            summary: `A dedicated developer with skills in ${Object.values(categorizedSkills)
              .flat()
              .slice(0, 5)
              .join(", ")}. Experienced in building projects like ${bestProjects
              .map(p => p.name)
              .join(", ")}. Seeking opportunities to contribute to innovative teams.`,
            enhancedExperience: workExperience,
          };
        }
      } else {
        console.warn("Groq API failed, using fallback summary.");
        aiOutput = {
          summary: `A dedicated developer with skills in ${Object.values(categorizedSkills)
            .flat()
            .slice(0, 5)
            .join(", ")}. Experienced in building projects like ${bestProjects
            .map(p => p.name)
            .join(", ")}. Seeking opportunities to contribute to innovative teams.`,
          enhancedExperience: workExperience,
        };
      }
    } else {
      aiOutput.summary = customSections.Summary.content || "";
      delete customSections.Summary;
    }

    // Construct response
    const response = {
      githubUsername,
      categorizedSkills,
      bestProjects,
      summary: aiOutput.summary,
      workExperience: customSections.Experience?.items || aiOutput.enhancedExperience,
      education: customSections.Education?.content || educationString,
      contactInfo: {
        email: contactInfo.email || "example@email.com",
        mobile: contactInfo.mobile || "+91 1234567890",
        linkedin: contactInfo.linkedin || "",
      },
      customSections,
      template,
    };

    res.json(response);
  } catch (error) {
    console.error("Error in /api/process-data:", error.stack || error);
    res.status(500).json({ error: error.message || "Data processing failed" });
  }
});

// Export PDF, DOCX, Portfolio Endpoints (unchanged from your provided code, but noted: PDF just echoes data—add pdfkit or similar for actual generation if needed)
app.post("/api/export-pdf", async (req, res) => {
  try {
    console.log('Received PDF generation request:', req.body);
    
    // Extract and structure the data
    const {
      name,
      githubUsername,
      summary,
      skills = { items: [] },
      projects = { items: [] },
      experience = { items: [] },
      education,
      certifications = { items: [] },
      contactInfo = {},
      template = "Minimal"
    } = req.body;

    // Validate required data
    if (!githubUsername && !name) {
      return res.status(400).json({ error: 'Either name or githubUsername is required' });
    }

    // Structure the data for PDF generation
    const pdfData = {
      name: name || githubUsername || 'Resume',
      contactInfo: {
        email: contactInfo.email || '',
        phone: contactInfo.phone || contactInfo.mobile || '',
        location: contactInfo.location || '',
        linkedin: contactInfo.linkedin || ''
      },
      summary: summary ? { content: typeof summary === 'string' ? summary : summary.content || '' } : null,
      skills: {
        items: Array.isArray(skills) ? skills : (skills.items || [])
      },
      projects: {
        items: (projects.items || []).map(p => ({
          name: p.name || '',
          description: p.description || '',
          stars: p.stargazers_count || p.stars || 0
        }))
      },
      experience: {
        items: (experience.items || []).map(exp => ({
          title: exp.title || '',
          description: exp.description || ''
        }))
      },
      education: education ? { content: typeof education === 'string' ? education : education.content || '' } : null,
      certifications: {
        items: Array.isArray(certifications) ? certifications : (certifications.items || [])
      },
      template
    };

    res.json(pdfData);
  } catch (error) {
    console.error("Error in /api/export-pdf:", error.message);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.post("/api/export-docx", async (req, res) => {
  const { githubUsername, categorizedSkills = {}, bestProjects = [], summary = "", workExperience = [], education = {}, contactInfo = {}, customSections = {} } = req.body;
  try {
    const doc = new Document({
      sections: [
        {
          properties: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
          children: [
            new Paragraph({ text: `${githubUsername || "Your Name"}'s Resume`, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }),
            new Paragraph({ text: sanitizeInput(summary || "No summary available"), spacing: { line: 276 } }),
            new Paragraph({
              text: `Contact: ${sanitizeInput(contactInfo.email || "example@email.com")}, ${sanitizeInput(contactInfo.mobile || "+91 1234567890")}${contactInfo.linkedin ? `, ${sanitizeInput(contactInfo.linkedin)}` : ""}`,
              spacing: { line: 276 },
            }),
            new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
            ...Object.entries(categorizedSkills).flatMap(([category, items]) => [
              new Paragraph({ text: sanitizeInput(category + ":"), spacing: { line: 276 } }),
              ...items.map(s => new Paragraph({ text: sanitizeInput(s), spacing: { line: 276 } })),
            ]),
            new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
            ...bestProjects.map(p => new Paragraph({ text: sanitizeInput(`${p.name} - ${p.description} (Stars: ${p.stargazers_count})`), spacing: { line: 276 } })),
            new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
            ...workExperience.flatMap(exp => [
              new Paragraph({ text: sanitizeInput(`${exp.title || "Title"} at ${exp.company || "Company"} (${exp.dates || "Dates"})`), spacing: { line: 276 } }),
              new Paragraph({ text: sanitizeInput(exp.description || "No description"), spacing: { line: 276 } }),
            ]),
            new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
            new Paragraph({
              text: sanitizeInput(customSections.Education?.content || (education.degree ? `${education.degree}, ${education.institution || ""} (${education.dates || education.year || "Not provided"})` : "Not provided")),
              spacing: { line: 276 },
            }),
            ...Object.entries(customSections)
              .filter(([title]) => !["Summary", "Skills", "Projects", "Experience", "Education"].includes(title))
              .flatMap(([title, section]) => [
                new Paragraph({ text: sanitizeInput(title), heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } }),
                ...(section.items
                  ? section.items.map(item => new Paragraph({ text: sanitizeInput(typeof item === "string" ? item : JSON.stringify(item)), spacing: { line: 276 } }))
                  : [new Paragraph({ text: sanitizeInput(section.content || "No content"), spacing: { line: 276 } })]),
              ]),
          ],
        },
      ],
    });
    const buffer = await Packer.toBuffer(doc);
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=${githubUsername || "resume"}_resume.docx`,
    });
    res.send(buffer);
  } catch (error) {
    console.error("Error in /api/export-docx:", error.message);
    res.status(500).json({ error: "Failed to generate DOCX" });
  }
});

app.post("/api/export-portfolio", async (req, res) => {
  const { githubUsername, categorizedSkills = {}, bestProjects = [], summary = "", workExperience = [], education = {}, template = "Minimal", contactInfo = {}, customSections = {} } = req.body;
  try {
    const portfolioHTML = getPortfolioHTML({ githubUsername, categorizedSkills, bestProjects, summary, workExperience, education, contactInfo, customSections }, template);
    const zip = new JSZip();
    zip.file("index.html", portfolioHTML);
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=portfolio.zip`,
    });
    res.send(zipBuffer);
  } catch (error) {
    console.error("Error in /api/export-portfolio:", error.message);
    res.status(500).json({ error: "Failed to generate portfolio ZIP" });
  }
});

// Helper: Get Resume HTML
function getResumeHTML(data, template) {
  const styles = {
    Minimal: `
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
      .resume { max-width: 800px; margin: auto; }
      .header { display: flex; justify-content: space-between; align-items: center; }
      .name-block { flex: 1; }
      .name { font-size: 24px; margin: 0; }
      .headline { font-size: 16px; color: #555; }
      .contact { text-align: right; font-size: 12px; }
      .contact a { color: #0066cc; text-decoration: none; }
      .rule { border-bottom: 1px solid #ccc; margin: 20px 0; }
      .section { margin-bottom: 20px; }
      .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
      .section-title span { border-bottom: 2px solid #0066cc; }
      .skills { display: flex; flex-wrap: wrap; }
      .skill-row { flex: 1 1 100%; margin-bottom: 10px; }
      .skill-label { font-weight: bold; }
      .skill-values { margin-left: 10px; }
      .item { display: flex; justify-content: space-between; margin-bottom: 10px; }
      .item-left { flex: 1; }
      .item-title { font-weight: bold; margin: 0; }
      .item-sub { margin: 5px 0; }
      .item-date { font-size: 12px; color: #555; text-align: right; }
      .bullets { margin: 5px 0; padding-left: 20px; }
      .placeholder { color: #999; font-style: italic; }
    `,
    "ATS-friendly": `
      body { font-family: Times New Roman, serif; font-size: 12pt; line-height: 1.5; margin: 1in; }
      .resume { max-width: 8.5in; }
      .header { margin-bottom: 0.5in; }
      .name-block { text-align: left; }
      .name { font-size: 14pt; font-weight: bold; margin: 0; }
      .headline { font-size: 12pt; margin: 0.2in 0; }
      .contact { font-size: 10pt; margin-top: 0.2in; }
      .contact a { text-decoration: none; color: black; }
      .rule { display: none; }
      .section { margin-bottom: 0.5in; }
      .section-title { font-weight: bold; font-size: 12pt; text-transform: uppercase; margin-bottom: 0.2in; }
      .section-title span { border-bottom: none; }
      .skills { display: block; }
      .skill-row { margin-bottom: 0.2in; }
      .skill-label { font-weight: bold; }
      .skill-values { margin-left: 0.5in; }
      .item { margin-bottom: 0.2in; }
      .item-left { flex: none; }
      .item-title { font-weight: bold; font-size: 12pt; }
      .item-sub { margin: 0.1in 0; }
      .item-date { font-size: 10pt; text-align: left; }
      .bullets { margin: 0.1in 0; padding-left: 0.5in; }
      .placeholder { font-style: normal; }
    `,
    Modern: `
      body { font-family: 'Helvetica Neue', sans-serif; margin: 30px; background: #f4f4f4; }
      .resume { max-width: 900px; margin: auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .header { display: flex; align-items: center; background: #0066cc; color: white; padding: 20px; }
      .name-block { flex: 1; }
      .name { font-size: 28px; margin: 0; }
      .headline { font-size: 16px; }
      .contact { font-size: 12px; }
      .contact a { color: white; text-decoration: none; }
      .rule { border-bottom: 2px solid #0066cc; margin: 20px 0; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 18px; color: #0066cc; margin-bottom: 10px; }
      .section-title span { border-bottom: 2px solid #ccc; }
      .skills { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .skill-row { margin-bottom: 10px; }
      .skill-label { font-weight: bold; color: #0066cc; }
      .skill-values { margin-left: 10px; }
      .item { display: flex; justify-content: space-between; margin-bottom: 15px; }
      .item-left { flex: 1; }
      .item-title { font-weight: bold; font-size: 14px; }
      .item-sub { margin: 5px 0; }
      .item-date { font-size: 12px; color: #555; }
      .bullets { margin: 5px 0; padding-left: 20px; }
      .placeholder { color: #999; font-style: italic; }
    `,
  };

  const { githubUsername, categorizedSkills, bestProjects, summary, workExperience, education = {}, contactInfo, customSections } = data;

  const sanitizedData = {
    githubUsername: sanitizeInput(githubUsername || "Your Name"),
    summary: sanitizeInput(summary || '<span class="placeholder">Edit here: Add summary</span>'),
    categorizedSkills: Object.fromEntries(
      Object.entries(categorizedSkills).map(([category, items]) => [sanitizeInput(category), items.map(item => sanitizeInput(item))]),
    ),
    bestProjects: bestProjects.map(p => ({
      ...p,
      name: sanitizeInput(p.name),
      description: sanitizeInput(p.description || "No description available"),
      html_url: sanitizeInput(p.html_url || ""),
      language: sanitizeInput(p.language || "N/A"),
      stargazers_count: p.stargazers_count || 0,
      created_at: p.created_at || "",
      pushed_at: p.pushed_at || "",
    })),
    workExperience: workExperience.map(exp => ({
      title: sanitizeInput(exp.title || "Title"),
      company: sanitizeInput(exp.company || "Company"),
      dates: sanitizeInput(exp.dates || "Dates"),
      description: sanitizeInput(exp.description || "Description"),
    })),
    education: {
      degree: sanitizeInput(education.degree || ""),
      institution: sanitizeInput(education.institution || ""),
      dates: sanitizeInput(education.dates || education.year || ""),
      gpa: sanitizeInput(education.gpa || ""),
    },
    contactInfo: {
      email: sanitizeInput(contactInfo.email || "example@email.com"),
      mobile: sanitizeInput(contactInfo.mobile || "+91 1234567890"),
      linkedin: sanitizeInput(contactInfo.linkedin || ""),
    },
    customSections: Object.fromEntries(
      Object.entries(customSections).map(([title, section]) => [
        sanitizeInput(title),
        {
          content: section.content ? sanitizeInput(section.content) : undefined,
          items: section.items ? section.items.map(item => sanitizeInput(typeof item === "string" ? item : JSON.stringify(item))) : undefined,
        },
      ]),
    ),
  };

  const educationString = sanitizedData.education.degree
    ? `${sanitizedData.education.degree}, ${sanitizedData.education.institution} (${sanitizedData.education.dates})${sanitizedData.education.gpa ? `; GPA: ${sanitizedData.education.gpa}` : ""}`
    : sanitizedData.customSections.Education?.content || '<span class="placeholder">Edit here: Add education</span>';

  let html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>${styles[template] || styles["ATS-friendly"]}</style>
      </head>
      <body>
        <div class="resume">
          <div class="header">
            <div class="name-block">
              <h1 class="name">${sanitizedData.githubUsername}</h1>
              <div class="headline">Software Developer</div>
            </div>
            <div class="contact">
              <div><a href="https://github.com/${sanitizedData.githubUsername}" aria-label="GitHub">GitHub</a></div>
              <div class="small">Email: ${sanitizedData.contactInfo.email}</div>
              <div class="small">Mobile: ${sanitizedData.contactInfo.mobile}</div>
              ${sanitizedData.contactInfo.linkedin ? `<div class="small"><a href="${sanitizedData.contactInfo.linkedin}">LinkedIn</a></div>` : ""}
            </div>
          </div>
          <div class="rule" aria-hidden="true"></div>
          <section class="section" aria-label="Summary">
            <div class="section-title"><span>SUMMARY</span></div>
            <p>${sanitizedData.summary}</p>
          </section>
          <div class="rule" aria-hidden="true"></div>
          <section class="section" aria-label="Skills">
            <div class="section-title"><span>SKILLS SUMMARY</span></div>
            <div class="skills" role="list">
              ${Object.entries(sanitizedData.categorizedSkills)
                .map(
                  ([category, items]) => `
                <div class="skill-row" role="listitem">
                  <div class="skill-label">${category}:</div>
                  <div class="skill-values">${items.length ? items.join(", ") : '<span class="placeholder">No items</span>'}</div>
                </div>
              `,
                )
                .join("")}
            </div>
          </section>
          <div class="rule" aria-hidden="true"></div>
          <section class="section" aria-label="Projects">
            <div class="section-title"><span>PROJECTS</span></div>
            ${sanitizedData.bestProjects.length
              ? sanitizedData.bestProjects
                  .map(
                    p => `
              <div class="item">
                <div class="item-left">
                  <p class="item-title"><a class="link" href="${p.html_url}" aria-label="${p.name}">${p.name}</a> (${p.language}) ⭐ ${p.stargazers_count}</p>
                  <ul class="bullets">
                    ${p.description.split("\n").filter(line => line.startsWith("- ")).map(line => `<li>${line.slice(2)}</li>`).join("") || "<li>No description available</li>"}
                  </ul>
                </div>
                <div class="item-date">${p.created_at ? new Date(p.created_at).toLocaleString("default", { month: "short", year: "numeric" }) : "N/A"} — ${
                      p.pushed_at ? new Date(p.pushed_at).toLocaleString("default", { month: "short", year: "numeric" }) : "N/A"
                    }</div>
              </div>
            `,
                  )
                  .join("")
              : '<p class="placeholder">Edit here: Add projects</p>'}
          </section>
          <div class="rule" aria-hidden="true"></div>
          <section class="section" aria-label="Work Experience">
            <div class="section-title"><span>WORK EXPERIENCE</span></div>
            ${sanitizedData.workExperience.length
              ? sanitizedData.workExperience
                  .map(
                    exp => `
              <div class="item">
                <div class="item-left">
                  <p class="item-title">${exp.title} <span style="font-weight:600; color:var(--accent); font-size:13px;">| ${exp.company}</span></p>
                  <p class="item-sub">${exp.description}</p>
                </div>
                <div class="item-date">${exp.dates}</div>
              </div>
            `,
                  )
                  .join("")
              : '<p class="placeholder">Edit here: Add experience</p>'}
          </section>
          <div class="rule" aria-hidden="true"></div>
          <section class="section" aria-label="Education">
            <div class="section-title"><span>EDUCATION</span></div>
            <div class="item">
              <div class="item-left">
                <p class="item-title">${sanitizedData.education.degree || "Education"}</p>
                <p class="item-sub">${educationString}</p>
              </div>
              <div class="item-date">${sanitizedData.education.dates || "N/A"}</div>
            </div>
          </section>
          ${Object.entries(sanitizedData.customSections)
            .filter(([title]) => !["Summary", "Skills", "Projects", "Experience", "Education"].includes(title))
            .map(
              ([title, section]) => `
            <div class="rule" aria-hidden="true"></div>
            <section class="section" aria-label="${title}">
              <div class="section-title"><span>${title.toUpperCase()}</span></div>
              ${section.items ? section.items.map(item => `<p>${item}</p>`).join("") : `<p>${section.content || '<span class="placeholder">No content</span>'}</p>`}
            </section>
          `,
            )
            .join("")}
        </div>
      </body>
    </html>
  `;
  return html;
}

// Helper: Get Portfolio HTML
function getPortfolioHTML(data, template) {
  const styles = {
    Minimal: `
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f4f4f4; }
      .portfolio { max-width: 900px; margin: auto; background: white; padding: 20px; }
      .nav { display: flex; justify-content: space-around; background: #0066cc; color: white; padding: 10px; }
      .nav a { color: white; text-decoration: none; }
      .header { text-align: center; margin-bottom: 20px; }
      .name { font-size: 28px; margin: 0; }
      .headline { font-size: 16px; color: #555; }
      .contact { text-align: center; font-size: 12px; margin-bottom: 20px; }
      .contact a { color: #0066cc; text-decoration: none; }
      .section { margin-bottom: 20px; }
      h2 { font-size: 18px; color: #0066cc; border-bottom: 2px solid #ccc; }
      .project { margin-bottom: 15px; }
      .item { margin-bottom: 10px; }
      .placeholder { color: #999; font-style: italic; }
      footer { text-align: center; font-size: 12px; color: #555; margin-top: 20px; }
    `,
    "ATS-friendly": `
      body { font-family: Times New Roman, serif; font-size: 12pt; line-height: 1.5; margin: 1in; }
      .portfolio { max-width: 8.5in; }
      .nav { display: none; }
      .header { margin-bottom: 0.5in; }
      .name { font-size: 14pt; font-weight: bold; }
      .headline { font-size: 12pt; }
      .contact { font-size: 10pt; margin-bottom: 0.2in; }
      .contact a { color: black; text-decoration: none; }
      .section { margin-bottom: 0.5in; }
      h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; }
      .project { margin-bottom: 0.2in; }
      .item { margin-bottom: 0.2in; }
      .placeholder { font-style: normal; }
      footer { font-size: 10pt; }
    `,
    Modern: `
      body { font-family: 'Helvetica Neue', sans-serif; margin: 0; padding: 30px; background: #f4f4f4; }
      .portfolio { max-width: 1000px; margin: auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .nav { display: flex; justify-content: center; gap: 20px; background: #0066cc; padding: 10px; }
      .nav a { color: white; text-decoration: none; font-size: 14px; }
      .header { text-align: center; background: #0066cc; color: white; padding: 20px; }
      .name { font-size: 32px; margin: 0; }
      .headline { font-size: 18px; }
      .contact { text-align: center; font-size: 12px; margin-bottom: 20px; }
      .contact a { color: #0066cc; }
      .section { margin-bottom: 30px; }
      h2 { font-size: 20px; color: #0066cc; border-bottom: 2px solid #ccc; }
      .project { margin-bottom: 20px; }
      .item { margin-bottom: 15px; }
      .placeholder { color: #999; font-style: italic; }
      footer { text-align: center; font-size: 12px; color: #555; }
    `,
  };

  const { githubUsername, categorizedSkills, bestProjects, summary, workExperience, education = {}, contactInfo, customSections } = data;
  const educationString = education.degree
    ? `${education.degree}, ${education.institution || ""} (${education.dates || education.year || ""})${education.gpa ? `; GPA: ${education.gpa}` : ""}`
    : customSections.Education?.content || '<span class="placeholder">Edit here: Add education</span>';

  let html = `
    <html>
      <head>
        <title>${githubUsername || "Your Name"}'s Portfolio</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>${styles[template] || styles["ATS-friendly"]}</style>
      </head>
      <body>
        <div class="portfolio">
          <nav class="nav">
            <a href="#summary">Summary</a>
            <a href="#skills">Skills</a>
            <a href="#projects">Projects</a>
            <a href="#experience">Experience</a>
            <a href="#education">Education</a>
            ${Object.keys(customSections)
              .map(title => `<a href="#${title.toLowerCase().replace(/\s+/g, "-")}">${title}</a>`)
              .join("")}
          </nav>
          <div class="header">
            <h1 class="name">${githubUsername || "Your Name"}</h1>
            <div class="headline">Software Developer</div>
          </div>
          <div class="contact">
            <a href="https://github.com/${githubUsername || "username"}">GitHub</a>
            <br>Email: ${contactInfo.email || "example@email.com"}
            <br>Mobile: ${contactInfo.mobile || "+91 1234567890"}
            ${contactInfo.linkedin ? `<br><a href="${contactInfo.linkedin}">LinkedIn</a>` : ""}
          </div>
          <section class="section" id="summary">
            <h2>SUMMARY</h2>
            <p>${summary || '<span class="placeholder">Edit here: Add summary</span>'}</p>
          </section>
          <section class="section" id="skills">
            <h2>SKILLS SUMMARY</h2>
            ${Object.entries(categorizedSkills)
              .map(
                ([category, items]) => `
              <h3>${category}:</h3>
              <p>${items.length ? items.join(", ") : '<span class="placeholder">No items</span>'}</p>
            `,
              )
              .join("")}
          </section>
          <section class="section" id="projects">
            <h2>PROJECTS</h2>
            ${bestProjects.length
              ? bestProjects
                  .map(
                    p => `
              <div class="project">
                <strong><a href="${p.html_url || "#"}">${p.name}</a></strong>
                <p>${p.description || "No description available"}</p>
                <p>Language: ${p.language || "N/A"} | Stars: ${p.stargazers_count || 0}</p>
              </div>
            `,
                  )
                  .join("")
              : '<p class="placeholder">Edit here: Add projects</p>'}
          </section>
          <section class="section" id="experience">
            <h2>WORK EXPERIENCE</h2>
            ${workExperience.length
              ? workExperience
                  .map(
                    exp => `
              <div class="item">
                <h3>${exp.title || "Title"} | ${exp.company || "Company"}</h3>
                <p>${exp.description || "Description"}</p>
                <p><em>${exp.dates || "Dates"}</em></p>
              </div>
            `,
                  )
                  .join("")
              : '<p class="placeholder">Edit here: Add experience</p>'}
          </section>
          <section class="section" id="education">
            <h2>EDUCATION</h2>
            <div class="item">
              <h3>${education.degree || "Education"}</h3>
              <p>${educationString}</p>
              <p><em>${education.dates || education.year || "N/A"}</em></p>
            </div>
          </section>
          ${Object.entries(customSections)
            .map(
              ([title, section]) => `
            <section class="section" id="${title.toLowerCase().replace(/\s+/g, "-")}">
              <h2>${title.toUpperCase()}</h2>
              ${section.items ? section.items.map(item => `<p>${item}</p>`).join("") : `<p>${section.content || '<span class="placeholder">No content</span>'}</p>`}
            </section>
          `,
            )
            .join("")}
          <footer><p>Generated Portfolio – ${new Date().toLocaleDateString()}</p></footer>
        </div>
      </body>
    </html>
  `;
  return html;
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT} at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`));