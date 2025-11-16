require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require('cookie-parser');
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const MemoryStore = require('express-session').MemoryStore;
const app = express();

const { Document, Packer, Paragraph, HeadingLevel } = require("docx");
const JSZip = require("jszip");



// === MIDDLEWARE ===
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
const sessionStore = new MemoryStore({
  checkPeriod: 86400000
});
const store = new MemoryStore({ checkPeriod: 86400000 });
app.use(
  session({
    store,
    secret: process.env.SESSION_SECRET || 'linkedin-fix-2025',
    resave: false,
    saveUninitialized: false,
    name: 'linkedin_resume_sid',
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,          // localhost
      sameSite: 'lax',
    },
  })
);
// Clear junk cookies


app.use(passport.initialize());
app.use(passport.session());



let userStore = {}; // In-memory store (use Redis in production)

passport.serializeUser((user, done) => {
  const id = user.id;
  userStore[id] = user;               // keep full object for dev
  console.log('serializeUser →', id);
  done(null, id);
});

passport.deserializeUser((id, done) => {
  const user = userStore[id];
  console.log('deserializeUser →', id, user ? 'FOUND' : 'MISSING');
  done(null, user || false);
});
// 1. First, replace your LinkedIn Strategy configuration:
// OPTION 1: Let Passport handle state (RECOMMENDED - simpler)


// ===== LeetCode Profile API =====
app.post("/api/leetcode", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "LeetCode username is required" });
  }

  try {
    const query = {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              ranking
            }
            languageProblemCount {
              languageName
              problemsSolved
            }
          }
        }
      `,
      variables: { username },
    };

    const response = await axios.post("https://leetcode.com/graphql", query, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://leetcode.com",
      },
    });

    const data = response.data?.data?.matchedUser;
    if (!data) return res.status(404).json({ error: "LeetCode user not found" });

    const languages = data.languageProblemCount?.map(l => ({
      name: l.languageName,
      solved: l.problemsSolved,
    })) || [];

    res.json({
      username: data.username,
      rank: data.profile?.ranking || "N/A",
      languages,
    });
  } catch (error) {
    console.error("LeetCode fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch LeetCode data" });
  }
});




const OAuth2Strategy = require('passport-oauth2');

passport.use('linkedin', new OAuth2Strategy({
  authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: 'http://localhost:4000/auth/linkedin/callback',
  scope: ['openid', 'profile', 'email'], // These are the only scopes that work
  state: true
}, async (accessToken, refreshToken, params, profile, done) => {
  try {
    console.log('\n🔄 OAuth2 Strategy Callback Triggered');
    console.log('Access Token:', accessToken ? 'Present ✓' : 'Missing ✗');
    
    // Store access token for later use
    const tokenData = {
      accessToken,
      refreshToken,
      expiresIn: params.expires_in,
      scope: params.scope
    };

    // 1. Fetch OpenID Connect userinfo (this works ✓)
    const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const profileData = userInfoResponse.data;
    console.log('✓ Got LinkedIn userinfo:', JSON.stringify(profileData, null, 2));

    // 2. Try to fetch v2/me (basic profile - might work with some data)
    let meData = null;
    try {
      const meResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'LinkedIn-Version': '202405' // Try latest API version
        }
      });
      meData = meResponse.data;
      console.log('✓ Got v2/me data:', JSON.stringify(meData, null, 2));
    } catch (err) {
      console.log('✗ v2/me failed:', err.response?.status, err.response?.data?.message);
    }

    // 3. Try to fetch email separately (might give more details)
    let emailData = null;
    try {
      const emailResponse = await axios.get(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      emailData = emailResponse.data;
      console.log('✓ Got email data:', JSON.stringify(emailData, null, 2));
    } catch (err) {
      console.log('✗ Email endpoint failed:', err.response?.status, err.response?.data?.message);
    }

    // 4. Try to fetch profile (lite profile - will likely fail)
    let liteProfile = null;
    try {
      const profileResponse = await axios.get(
        'https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      liteProfile = profileResponse.data;
      console.log('✓ Got lite profile:', JSON.stringify(liteProfile, null, 2));
    } catch (err) {
      console.log('✗ Lite profile failed:', err.response?.status, err.response?.data?.message);
    }

    // 5. Try to fetch positions/experience (will likely fail - requires r_basicprofile)
    let positions = null;
    try {
      const positionsResponse = await axios.get(
        'https://api.linkedin.com/v2/positions?q=members&projection=(elements*(company,title))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      positions = positionsResponse.data;
      console.log('✓ Got positions:', JSON.stringify(positions, null, 2));
    } catch (err) {
      console.log('✗ Positions failed:', err.response?.status, err.response?.data?.message);
    }

    // 6. Try to fetch skills (will likely fail)
    let skills = null;
    try {
      const skillsResponse = await axios.get(
        'https://api.linkedin.com/v2/skills?q=members',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      skills = skillsResponse.data;
      console.log('✓ Got skills:', JSON.stringify(skills, null, 2));
    } catch (err) {
      console.log('✗ Skills failed:', err.response?.status, err.response?.data?.message);
    }

    // Build comprehensive user object with ALL available data
    const user = {
      // Basic identity (from OpenID - guaranteed to work)
      id: profileData.sub,
      firstName: profileData.given_name || '',
      lastName: profileData.family_name || '',
      fullName: profileData.name || '',
      email: profileData.email || '',
      emailVerified: profileData.email_verified || false,
      pictureUrl: profileData.picture || '',
      locale: profileData.locale || null,
      
      // Additional data if available
      vanityName: profileData.email?.split('@')[0] || '',
      
      // Store raw API responses for debugging
      rawData: {
        userInfo: profileData,
        me: meData,
        email: emailData,
        liteProfile: liteProfile,
        positions: positions,
        skills: skills
      },
      
      // Token info (store if you need to make API calls later)
      tokens: tokenData,
      
      // Placeholder arrays (will be empty unless API returns data)
      experience: positions?.elements || [],
      skills: skills?.elements || [],
      education: [] // No endpoint for this with current scopes
    };

    console.log('\n✓ FINAL USER OBJECT:');
    console.log(JSON.stringify(user, null, 2));
    console.log('\n📊 DATA SUMMARY:');
    console.log(`  Name: ${user.fullName}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Picture: ${user.pictureUrl ? 'Yes' : 'No'}`);
    console.log(`  Experience: ${user.experience.length} items`);
    console.log(`  Skills: ${user.skills.length} items`);
    
    return done(null, user);
    
  } catch (err) {
    console.error('✗ LinkedIn profile fetch error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    }
    return done(err);
  }
}));

// Initial auth route - DON'T set state manually
app.get('/auth/linkedin', (req, res, next) => {
  console.log('\n🔐 /auth/linkedin hit - initiating OAuth');
  passport.authenticate('linkedin', {
    scope: ['openid', 'profile', 'email']
  })(req, res, next);
});

// Callback route - DON'T check state manually, passport does it
app.get('/auth/linkedin/callback', (req, res, next) => {
  console.log('\n✓ CALLBACK HIT');
  console.log('Code present:', !!req.query.code);
  console.log('Error in query:', req.query.error);

  // Check for OAuth errors from LinkedIn
  if (req.query.error) {
    console.error('✗ OAuth error:', req.query.error, req.query.error_description);
    return res.redirect('http://localhost:3000/input?error=oauth_' + req.query.error);
  }

  // Authenticate with passport
  passport.authenticate('linkedin', (err, user, info) => {
    if (err) {
      console.error('✗ Auth error:', err.message);
      console.error('Error details:', err);
      return res.redirect('http://localhost:3000/input?error=auth_failed');
    }

    if (!user) {
      console.error('✗ No user returned');
      console.error('Info:', info);
      return res.redirect('http://localhost:3000/input?error=no_user');
    }

    console.log('✓ User authenticated:', user.id);
    console.log('User data:', JSON.stringify(user, null, 2));

    // Log the user in
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('✗ req.login failed:', loginErr.message);
        return res.redirect('http://localhost:3000/input?error=login_failed');
      }

      console.log('✓ Login successful!');
      console.log('  Session ID:', req.sessionID);
      console.log('  User stored:', !!req.user);
      
      res.redirect('http://localhost:3000/input?linkedin=success');
    });
  })(req, res, next);
});

app.get('/debug/linkedin-token', async (req, res) => {
  const testToken = req.query.token;
  if (!testToken) {
    return res.json({ error: 'Provide ?token=YOUR_ACCESS_TOKEN' });
  }

  try {
    const [userinfo, email] = await Promise.all([
      axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${testToken}` }
      }),
      axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: { Authorization: `Bearer ${testToken}` }
      })
    ]);

    res.json({
      userinfo: userinfo.data,
      email: email.data
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
  }
});
app.get('/api/linkedin/status', (req, res) => {
  console.log('\n📋 /api/linkedin/status');
  console.log(`  → Authenticated: ${req.isAuthenticated()}`);
  console.log(`  → User: ${req.user?.id || 'NONE'}`);
  console.log(`  → Session ID: ${req.sessionID}`);
  console.log(`  → User store size: ${Object.keys(userStore).length}\n`);
  
  res.json({
    authenticated: !!req.user,
    user: req.user ? {
      id: req.user.id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email
    } : null
  });
});

const puppeteer = require('puppeteer');

app.post('/api/linkedin/public', async (req, res) => {
  let { url } = req.body;
  if (!url?.includes('linkedin.com/in/')) return res.status(400).json({ error: 'Invalid URL' });

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('script[type="application/ld+json"]', { timeout: 10000 });

    const json = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]');
      return script ? JSON.parse(script.textContent) : null;
    });

    await browser.close();

    if (!json) throw new Error('No JSON-LD found');

    res.json({
      name: json.name || 'Unknown',
      headline: json.description || '',
      image: json.image || '',
      worksFor: (json.worksFor || []).map(w => ({
        company: w.name || w.organization?.name || '',
        jobTitle: w.jobTitle || ''
      }))
    });
  } catch (err) {
    if (browser) await browser.close();
    console.warn('Public parse failed:', err.message);
    res.json({ name: 'Profile', headline: 'Private', image: '', worksFor: [] });
  }
});
// ---- NEW ENDPOINT (add after /api/linkedin/profile) ----
// server/routes/linkedin.js
app.get('/api/linkedin/avatar', async (req, res) => {
  const token = req.cookies.accessToken;
  const r = await fetch('https://api.linkedin.com/v2/me?projection=(profilePicture(displayImage~:playableStreams))', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await r.json();
  const url = data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier;
  if (!url) return res.status(404).send();
  const img = await fetch(url);
  res.set('Content-Type', img.headers.get('content-type'));
  img.body.pipe(res);
});
// LinkedIn API routes
app.get('/api/linkedin/profile', (req, res) => {
  console.log('\n👤 /api/linkedin/profile');
  console.log(`  → Authenticated: ${req.isAuthenticated()}`);
  console.log(`  → User: ${req.user?.id || 'NONE'}\n`);

  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Return everything we managed to fetch
  res.json({
    // User identity
    id: req.user.id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    fullName: req.user.fullName,
    email: req.user.email,
    emailVerified: req.user.emailVerified,
    pictureUrl: req.user.pictureUrl,
    vanityName: req.user.vanityName,
    locale: req.user.locale,
    
    // Additional data (likely empty with current scopes)
    experience: req.user.experience,
    skills: req.user.skills,
    education: req.user.education,
    
    // Raw API responses for frontend debugging
    debug: {
      availableEndpoints: Object.keys(req.user.rawData),
      apiResponses: req.user.rawData
    }
  });
});


// LinkedIn OAuth routes

app.get('/api/linkedin/experience', (req, res) => {
  if (!req.user?.experience) {
    return res.status(401).json({ error: 'No LinkedIn data' });
  }
  res.json({ experience: req.user.experience });
});

// Logout
app.get('/api/linkedin/logout', (req, res) => {
  const userId = req.user?.id;
  
  req.logout((err) => {
    if (err) console.error('Logout error:', err);
  });

  if (userId) {
    delete userStore[userId];
    console.log(`✓ User removed: ${userId}`);
  }

  req.session.destroy(() => {
    console.log('✓ Session destroyed');
  });

  res.redirect('http://localhost:3000/input');
});

app.get('/api/linkedin/debug-data', (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    summary: {
      name: req.user.fullName,
      email: req.user.email,
      picture: req.user.pictureUrl,
      experienceCount: req.user.experience?.length || 0,
      skillsCount: req.user.skills?.length || 0
    },
    rawApiResponses: req.user.rawData,
    availableScopes: req.user.tokens?.scope || 'unknown',
    tokenExpiry: req.user.tokens?.expiresIn || 'unknown'
  });
});
// Replace your /api/linkedin/experience endpoint


// Portfolio HTML Generation Function
function generatePortfolioHTML(resumeData) {
  const {
    name,
    githubUsername,
    summary,
    skills,
    projects,
    experience,
    education,
    contactInfo
  } = resumeData;

  // Helper function to create project cards HTML
 const generateProjectCards = (projects) => {
  if (!projects) return '';
  const projectList = projects.items || projects; // handle both shapes

  return projectList.map(project => `
    <div class="project-card">
      <h3><a href="${project.html_url || project.link || '#'}" target="_blank">${project.name}</a></h3>
      <p>${project.description || 'No description available'}</p>
      ${project.technologies ? `
      <div class="technologies">
        ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
      </div>
      ` : ''}
      ${project.stars ? `<div class="stars">⭐ ${project.stars}</div>` : ''}
    </div>
  `).join('');
};


  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name || githubUsername}'s Portfolio</title>
    <style>
        :root {
            --primary-color: #4a148c;
            --secondary-color: #7b1fa2;
            --text-color: #333;
            --background-color: #f5f5f5;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background: var(--background-color);
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        header {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 4rem 2rem;
            text-align: center;
        }

        h1 {
            font-size: 2.5rem;
            margin: 0;
        }

        .contact-info {
            margin-top: 1rem;
        }

        section {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            margin: 2rem 0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h2 {
            color: var(--primary-color);
            border-bottom: 2px solid var(--secondary-color);
            padding-bottom: 0.5rem;
            margin-top: 0;
        }

        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }

        .skill-category {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
        }

        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
        }

        .project-card {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1.5rem;
            transition: transform 0.2s;
        }

        .project-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .tech-tag {
            display: inline-block;
            background: var(--primary-color);
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            margin: 0.2rem;
            font-size: 0.9rem;
        }

        .experience-item {
            margin-bottom: 2rem;
        }

        .timeline {
            color: var(--secondary-color);
            font-weight: bold;
        }

        @media (max-width: 768px) {
            .projects-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>${name || githubUsername}</h1>
        <div class="contact-info">
            ${contactInfo?.email ? `<p>📧 ${contactInfo.email}</p>` : ''}
            ${contactInfo?.mobile ? `<p>📱 ${contactInfo.mobile}</p>` : ''}
            ${contactInfo?.linkedin ? `<p>💼 <a href="${contactInfo.linkedin}" target="_blank">LinkedIn</a></p>` : ''}
        </div>
    </header>

    <div class="container">
        ${summary ? `
        <section id="about">
            <h2>About Me</h2>
            <p>${summary}</p>
        </section>
        ` : ''}

        ${skills ? `
        <section id="skills">
            <h2>Skills</h2>
            <div class="skills-grid">
                ${Object.entries(skills).map(([category, skillsList]) => `
                    <div class="skill-category">
                        <h3>${category}</h3>
                        <p>${Array.isArray(skillsList) ? skillsList.join(', ') : skillsList}</p>
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        ${projects?.items?.length ? `
        <section id="projects">
            <h2>Featured Projects</h2>
            <div class="projects-grid">
                ${generateProjectCards(projects)}
            </div>
        </section>
        ` : ''}

        ${experience?.items?.length ? `
        <section id="experience">
            <h2>Professional Experience</h2>
            ${experience.items.map(exp => `
                <div class="experience-item">
                    <h3>${exp.title}</h3>
                    <p class="timeline">${exp.company} | ${exp.dates || 'Present'}</p>
                    <p>${exp.description || ''}</p>
                </div>
            `).join('')}
        </section>
        ` : ''}

        ${education ? `
        <section id="education">
            <h2>Education</h2>
            <div class="education-item">
                ${typeof education === 'string' ? education : `
                    <h3>${education.degree}</h3>
                    <p>${education.institution}</p>
                    ${education.dates ? `<p>${education.dates}</p>` : ''}
                    ${education.gpa ? `<p>GPA: ${education.gpa}</p>` : ''}
                `}
            </div>
        </section>
        ` : ''}
    </div>
</body>
</html>`;
}

// Portfolio Generation Endpoint
app.post("/api/generate-portfolio", async (req, res) => {
  try {
    const { resumeData } = req.body;
    console.log("Received resumeData for portfolio generation:", JSON.stringify(resumeData, null, 2));
    
    const portfolioCode = generatePortfolioHTML(resumeData);
    res.json({ portfolioCode });
  } catch (error) {
    console.error("Portfolio generation error:", error);
    res.status(500).json({ error: error.message });
  }
});



function extractJson(text) {
  if (!text) return null;

  // Try to find the first JSON object in the text
  const match = text.match(/{[\s\S]*}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}


app.post("/api/enhance-experience", async (req, res) => {
  const { experience, education } = req.body;

  if (!experience && !education) {
    return res.status(400).json({ error: "Please enter experience or education" });
  }

  const prompt = `
Improve the following resume experience & education.
⭐ Return ONLY pure JSON — no markdown, no explanation.

Input Experience: ${experience}
Input Education: ${education}

Output Format:
{
  "enhancedExperience": [
    {
      "title": "Role Title",
      "company": "Company",
      "dates": "",
      "description": "Enhanced bullet points"
    }
  ],
  "enhancedEducation": {
    "degree": "",
    "institution": "",
    "dates": "",
    "gpa": ""
  }
}
`;

  const aiResponse = await safeGenerateContent({
    model: "llama-3.1-8b-instant",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  console.log("🔍 RAW AI OUTPUT:", aiResponse);

  // Extract JSON safely
  const json = extractJson(aiResponse);

  if (!json) {
    return res.status(500).json({
      error: "AI returned invalid JSON",
      raw: aiResponse,
    });
  }

  res.json(json);
});




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
      const content = result.data.choices[0].message.content;
      
      // If the prompt asks for JSON, try to ensure we get valid JSON
      if (content.includes("Return JSON:") || payload.messages[0].content.includes("Return JSON:")) {
        try {
          // Try to extract JSON from the response if it's not already JSON
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          // If no JSON found in response, create a fallback JSON
          return await localGenerateContent({ contents, model });
        } catch (parseErr) {
          console.warn("Failed to parse Groq response as JSON:", parseErr.message);
          return await localGenerateContent({ contents, model });
        }
      }
      return content;
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
      model: GROQ_MODELS.DEFAULT,
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
      model: GROQ_MODELS.DEFAULT,
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
    const { 
      githubUsername, 
      leetcodeUser, 
      workExperience = [], 
      education = {}, 
      contactInfo = {}, 
      customSections = {}, 
      template = "ATS-friendly",
      projects = { title: "Projects", items: [] }  // Add default projects section
    } = req.body;
    
    // Initialize projectsSection with default values
    const projectsSection = {
      title: projects.title || "Projects",
      items: Array.isArray(projects.items) ? projects.items : []
    };
    
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
      // First verify the user exists
      const userRes = await axios.get(`https://api.github.com/users/${githubUsername}`, {
        headers: { Accept: "application/vnd.github.v3+json", ...githubAuthHeader },
      });
      if (!userRes.data) throw new Error("GitHub user not found");

      // Then fetch repositories
      const githubRes = await axios.get(`https://api.github.com/users/${githubUsername}/repos`, {
        headers: { Accept: "application/vnd.github.v3+json", ...githubAuthHeader },
        params: {
          sort: 'updated',
          direction: 'desc',
          per_page: 10 // Limit to most recent 10 repos
        }
      });
      if (!githubRes.data) throw new Error("No repositories found");
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
    console.log("🔍 Fetching LeetCode data for:", leetcodeUser);

    const query = {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile { ranking reputation countryName }
            languageProblemCount {
              languageName
              problemsSolved
            }
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }`,
      variables: { username: leetcodeUser },
    };

    const lcRes = await axios.post("https://leetcode.com/graphql", query, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://leetcode.com",
      },
    });

    const lcData = lcRes.data?.data?.matchedUser;

    if (!lcData) {
      console.warn("⚠️ No user data returned from LeetCode for:", leetcodeUser);
    } else {
      console.log("✅ LeetCode user found:", lcData.username);
      console.log("🏆 Rank:", lcData.profile?.ranking);
      console.log("💻 Languages:", lcData.languageProblemCount?.map(l => l.languageName));

      // Save parsed results
      req.leetcodeData = {
        username: lcData.username,
        rank: lcData.profile?.ranking || "N/A",
        languagesUsed: lcData.languageProblemCount?.map(l => ({
          name: l.languageName,
          solved: l.problemsSolved,
        })) || [],
      };
    }
  } catch (err) {
    console.error("❌ LeetCode fetch failed:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    }
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
            // Convert languages object to array of names, sorted by usage
            const techStack = Object.entries(languages)
              .sort(([,a], [,b]) => b - a)  // Sort by byte count
              .map(([lang]) => lang)        // Get just the language names
              .slice(0, 3);                 // Take top 3 most used languages
            
            const langScore = getLanguageScore(languages);
            const recencyScore = Math.max(0, 6 - (Date.now() - new Date(r.pushed_at)) / (1000 * 60 * 60 * 24 * 30));
            const descScore = r.description ? 3 : 0;
            const totalScore = langScore + recencyScore + descScore;
            let readmeSummary = r.description || "No description available";
            try {
              // First check if README exists
              const readmeMetaRes = await axios.get(
                `https://api.github.com/repos/${githubUsername}/${r.name}/contents/README.md`,
                { headers: { Accept: "application/vnd.github.v3+json", ...githubAuthHeader } },
              );
              
              if (readmeMetaRes.data) {
                // Then fetch the actual README content
                const readmeRes = await axios.get(readmeMetaRes.data.download_url, {
                  headers: { ...githubAuthHeader }
                });
                readmeSummary = await summarizeReadme(r.name, readmeRes.data);
              } else {
                console.warn(`No README.md found for ${r.name}`);
              }
            } catch (readmeErr) {
              // Try README.markdown if README.md doesn't exist
              try {
                const readmeMetaRes = await axios.get(
                  `https://api.github.com/repos/${githubUsername}/${r.name}/contents/README.markdown`,
                  { headers: { Accept: "application/vnd.github.v3+json", ...githubAuthHeader } },
                );
                
                if (readmeMetaRes.data) {
                  const readmeRes = await axios.get(readmeMetaRes.data.download_url, {
                    headers: { ...githubAuthHeader }
                  });
                  readmeSummary = await summarizeReadme(r.name, readmeRes.data);
                }
              } catch (markdownErr) {
                console.warn(`Error fetching README for ${r.name}:`, readmeErr.message);
              }
            }
            return { ...r, description: readmeSummary, score: totalScore };
          } catch (err) {
            console.warn(`Error processing repo ${r.name}:`, err.message);
            return { 
              ...r, 
              description: r.description || "No description available",
              techStack: [],  // Empty tech stack for failed fetches
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

    // Sort and select best projects
    allProjects.sort((a, b) => b.score - a.score);
    const bestProjects = allProjects.slice(0, 2).map(project => {
      // Get key points from description
      const keyPoints = (project.description || '')
        .split(/[.!?]/)
        .filter(s => s.trim().length > 0)
        .slice(0, 3)
        .map(s => s.trim())
        .join('\n• ');

      return {
        name: project.name,
        description: keyPoints ? `• ${keyPoints}` : project.description || 'No description available',
        stars: project.stargazers_count || 0,
        url: project.html_url,
        technologies: project.techStack || []
      };
    });

    // Allow custom projects to override
    if (customSections.Projects) {
      const customProjects = customSections.Projects.items || [];
      delete customSections.Projects;
    }

    // Prepare AI prompt for resume summary
    const educationString =
      customSections.Education?.content ||
      (education && education.degree
        ? `${education.degree}, ${education.institution || ""} (${education.dates || education.year || "Not provided"})`
        : "Not provided");

    // Add projects to the response data structure
    const responseData = {
      summary: "",
      enhancedExperience: workExperience,
      skills: categorizedSkills,
      projects: {
        title: "Projects",
        items: bestProjects.map(project => ({
          name: project.name,
          description: project.description,
          stars: project.stargazers_count,
          url: project.html_url,
          technologies: project.techStack || []
        }))
      },
      education: educationString,
      contactInfo: contactInfo,
      template: template,
    };

    console.log('Projects data:', JSON.stringify(responseData.projects, null, 2));

    const prompt = `You are a professional resume writer. Generate a resume summary in strict JSON format. Output ONLY the JSON object - no explanations, no markdown.

Input Data:
Skills: ${JSON.stringify(
      Object.fromEntries(
        Object.entries(categorizedSkills || {}).map(([k, v]) => [k, v.slice(0, 5)]),
      ),
    )}
Projects: ${JSON.stringify((projectsSection?.items || []).slice(0, 3))}
Work: ${JSON.stringify((workExperience || []).slice(0, 2))}
Education: ${(educationString || '').slice(0, 100)}

Required Output Format (exactly this structure):
{
  "summary": "3-5 sentence professional summary highlighting skills and achievements",
  "enhancedExperience": [
    {
      "title": "Role or Project",
      "description": "Key responsibilities and impact",
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ]
}

Remember: Respond with ONLY the JSON object, no other text.`;

    let aiOutput = { summary: "", enhancedExperience: workExperience };
    if (!customSections.Summary) {
      const aiText = await safeGenerateContent({
        model: GROQ_MODELS.DEFAULT,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, max_tokens: 512 },
      });

      // -------------------------------------------------
      // Robust JSON extraction
      // -------------------------------------------------
      let raw = typeof aiText === "string" ? aiText.trim() : "";
      if (!raw) {
        console.warn("Groq returned empty response – using fallback summary");
      } else {
        // Try to pull out a JSON block if the model wrapped it in markdown
        const jsonMatch = raw.match(/```(?:json)?\s*({[\s\S]*?})\s*```/i) || raw.match(/({[\s\S]*})/);
        if (jsonMatch) raw = jsonMatch[1];

        try {
          aiOutput = JSON.parse(raw);
        } catch (parseErr) {
          console.warn("Groq JSON parse failed – raw output:", raw);
          console.warn("Parse error:", parseErr.message);
          // Let the code fall through to the fallback
        }
      }

      // -------------------------------------------------
      // Fallback when we still have no valid JSON
      // -------------------------------------------------
      if (!aiOutput || typeof aiOutput !== "object") {
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
function getFullName(linkedinUser, githubUsername) {
  if (linkedinUser?.firstName && linkedinUser?.lastName) {
    return `${linkedinUser.firstName} ${linkedinUser.lastName}`.trim();
  }
  return githubUsername || "Your Name";
}const fullName = getFullName(req.user, githubUsername);

const response = {
  githubUsername,
  fullName,                     // <-- NEW
  linkedinPicture: req.user?.pictureUrl || null, // <-- NEW
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

  const { githubUsername, categorizedSkills, bestProjects, summary, workExperience,linkedinExperience, education = {}, contactInfo, customSections } = data;
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

  <!-- 1. LinkedIn data (if it exists) -->
  ${linkedinExperience?.length
    ? linkedinExperience
        .map(exp => `
          <div class="item">
            <h3>${sanitize(exp.title)} | ${sanitize(exp.company)}</h3>
            ${exp.description ? `<p>${sanitize(exp.description)}</p>` : ''}
            <p><em>${exp.startDate || ''}${exp.endDate ? ` – ${exp.endDate}` : ''}</em></p>
          </div>
        `)
        .join('')
    : ''}



  <!-- 2. Nothing at all → placeholder -->
  ${(!linkedinExperience?.length && (!workExperience?.length)) 
    ? '<p class="placeholder">Edit here: Add experience</p>'
    : ''}
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