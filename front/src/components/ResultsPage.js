// src/components/ResultsPage.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { handleDownloadAndOpenPDF } from "./handleDownloadAndOpenPDF";
import ResumePDF from "./ResumePDF";
import { generateRealPDF } from "./ResumePDF";
import { useAuth } from "../context/AuthContext";
/* ---------- TEMPLATE IMPORTS ---------- */
import atsTemplate from "../templates/resume/ats";
import creativeTemplate from "../templates/resume/creative";
import minimalTemplate from "../templates/resume/minimal";
import modernTemplate from "../templates/resume/modern";
import sidebarTemplate from "../templates/resume/sidebar";

import darkneonTemplate from "../templates/portfolio/darkneon";
import glassTemplate from "../templates/portfolio/glass";
import gridTemplate from "../templates/portfolio/grid";
import minimalPortfolioTemplate from "../templates/portfolio/minimal";
import animatedTemplate from "../templates/portfolio/animated";
import retroTemplate from "../templates/portfolio/retro";
import minimalbwTemplate from "../templates/portfolio/minimal_b&w";

import { useLocation } from "react-router-dom";


/* ---------- RESUME TEMPLATES ---------- */
const RESUME_TEMPLATES = {
  ats: atsTemplate,
  creative: creativeTemplate,
  minimal: minimalTemplate,
  modern: modernTemplate,
  sidebar: sidebarTemplate,
};

/* ---------- TEMPLATE OPTIONS ---------- */
const RESUME_TEMPLATE_OPTIONS = [
  { value: "ats",      label: "ATS Friendly" },
  { value: "creative", label: "Creative" },
  { value: "minimal",  label: "Minimal" },
  { value: "modern",   label: "Modern" },
  { value: "sidebar",  label: "Sidebar" },
];

const TEMPLATE_NAME_MAP = {
  "ATS-friendly": "ats",
  Creative: "creative",
  Minimal: "minimal",
  Modern: "modern",
  Sidebar: "sidebar",
};

const PORTFOLIO_TEMPLATES = {
  "Dark Neon": darkneonTemplate,
  "Glass Morphism": glassTemplate,
  "Grid Layout": gridTemplate,
  "Minimal Clean": minimalPortfolioTemplate,
  "Animated": animatedTemplate,
  "Retro": retroTemplate,
  "Minimal B&W": minimalbwTemplate,
};

/* ---------- STYLES (only for UI controls) ---------- */
const styles = {
  container: { minHeight: "100vh", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", padding: "32px 16px" },
  content: { maxWidth: 1200, margin: "0 auto" },

  /* Tabs */
  tabContainer: { display: "flex", gap: 12, marginBottom: 24 },
  tabBtn: { padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 },
  activeTab: { background: "#4f46e5", color: "#fff" },

  /* Header (controls only) */
  headerCard: { background: "#fff", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,.1)", padding: 32, marginBottom: 24 },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" },
  buttonGroup: { display: "flex", gap: 12, alignItems: "center" },

  /* Buttons */
  primaryBtn: { padding: "12px 24px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600 },
  generateBtn: { background: "linear-gradient(135deg,#4f46e5,#9333ea)", color: "#fff" },
  pdfBtn: { background: "linear-gradient(135deg,#9333ea,#3b82f6)", color: "#fff" },
  editBtn: { background: "#7a5836", color: "#fff" },

  /* Portfolio preview */
  portfolioContainer: { background: "#fff", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,.1)", padding: 24, marginBottom: 24 },
  portfolioHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  portfolioTitle: { fontSize: 24, fontWeight: "bold", color: "#111827", margin: 0 },
  portfolioActions: { display: "flex", gap: 12 },
  actionBtn: { padding: "8px 16px", background: "#9333ea", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 500 },
  codePreview: { background: "#1e1e1e", borderRadius: 8, padding: 16, overflow: "auto", maxHeight: 600 },
  codeBlock: { margin: 0, color: "#fff", fontFamily: "monospace", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  iframe: { width: "100%", height: "70vh", border: "none", borderRadius: 8 },

  /* Loading / Error */
  loadingContainer: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)" },
  spinner: { width: 48, height: 48, border: "4px solid #e5e7eb", borderTop: "4px solid #9333ea", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 },
  errorCard: { background: "#fff", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,.1)", padding: 32, maxWidth: 400, textAlign: "center" },

  /* Editor panel */
  editorBox: { width: 420, background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 6px 20px rgba(0,0,0,.08)" },
  input: { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", marginBottom: 8 },
  textareaEditor: { width: "100%", padding: 8, minHeight: 96, borderRadius: 6, border: "1px solid #ddd", marginBottom: 8 },
};

/* ---------- MAIN COMPONENT ---------- */
export default function ResultsPage({
  data = {},
  error: initialError = "",
  isLoading: initialIsLoading = false,
  aiOverview = "",
  selectedTemplate = "ATS-friendly",
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();


  /* ---------- STATE ---------- */
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState("resume");
  const [portfolioCode, setPortfolioCode] = useState("");
  const [resumeData, setResumeData] = useState({});
  const [localError, setLocalError] = useState(initialError);
  const [localLoading, setLocalLoading] = useState(initialIsLoading);
  const [templateName, setTemplateName] = useState(selectedTemplate);
  const [portfolioTemplateName, setPortfolioTemplateName] = useState("Dark Neon");
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const originalRef = useRef(null);

  /* ---------- INITIAL DATA NORMALISATION ---------- */
  useEffect(() => {
    if (hasInitialized) return;

    const fromBackend = data || {};
    console.log("🔥 FRONTEND received backend data:", fromBackend);

    const enhancedExp = location.state?.aiEnhancedExperience;
const enhancedEdu = location.state?.aiEnhancedEducation;

    const githubUsername =
      fromBackend.fullName ||
      fromBackend.name ||
      fromBackend.githubUsername ||
      (user && (user.fullName || user.name)) ||
      "Your Name";

      // --- merge LeetCode languages into programming languages ---
// --- merge LeetCode languages into programming languages ---
const lcLangs = (fromBackend.leetcodeData?.languagesUsed || [])
  .map(l => l.name.trim());

// existing programming languages from backend
const existingPL = new Set(
  (fromBackend.categorizedSkills?.["Programming Languages"] || [])
    .map(s => s.trim())
);

// add LeetCode languages (no repeats)
lcLangs.forEach(lang => existingPL.add(lang));



    const normalized = {
      githubUsername,
      profilePictureUrl:
        fromBackend.linkedInProfile?.pictureUrl ||
        user?.pictureUrl ||
        user?.picture ||
        null,
      headline: fromBackend.headline || user?.headline || "Software Developer",
      contactInfo: {
        email:
          fromBackend.contactInfo?.email ||
          fromBackend.email ||
          user?.email ||
          "",
        mobile: fromBackend.contactInfo?.mobile || "",
        linkedin: fromBackend.contactInfo?.linkedin || user?.profileUrl || "",
      },
      summary:
  (fromBackend.summary || aiOverview || "") +
  (fromBackend.leetcodeData?.totalSolved >= 200
    ? `\nSolved 200+ problems on LeetCode.`
    : ""),

      

// merge back into categorized skills
categorizedSkills: {
  ...fromBackend.categorizedSkills,
  "Programming Languages": Array.from(existingPL),
},



      projects: {
        title: "Projects",
        items: (fromBackend.bestProjects || []).map(p => ({
          name: p.name || "",
          html_url: p.url || p.html_url || "",
          description: p.description || "",
          technologies: p.technologies || [],
          stars: p.stars || p.stargazers_count || 0,
        })),
      },
      experience: {
  title: "Experience",
  items: enhancedExp || (
    Array.isArray(fromBackend.workExperience)
      ? fromBackend.workExperience
      : []
  ),
},

education:
  typeof enhancedEdu === "object" && enhancedEdu !== null
    ? `
${enhancedEdu.degree || ""}
${enhancedEdu.institution || ""}
${enhancedEdu.dates || ""}
${enhancedEdu.gpa ? `GPA: ${enhancedEdu.gpa}` : ""}
`
    : enhancedEdu || fromBackend.education || "",

      leetcodeData: fromBackend.leetcodeData || null,
    };

    originalRef.current = JSON.parse(JSON.stringify(normalized));
    setResumeData(normalized);
    setHasInitialized(true);
  }, [data, user, aiOverview, hasInitialized]);

  /* ---------- SYNC PROP → INTERNAL KEY ---------- */
  useEffect(() => {
    const key = TEMPLATE_NAME_MAP[selectedTemplate] ?? "ats";
    setTemplateName(key);
  }, [selectedTemplate]);

  /* ---------- TEMPLATE RENDERERS ---------- */
  const renderResumeHTML = () => {
    const fn = RESUME_TEMPLATES[templateName] || minimalTemplate;
    try {
      return fn({
        githubUsername: resumeData.githubUsername,
        summary: resumeData.summary,
        categorizedSkills: resumeData.categorizedSkills,
        projects: resumeData.projects,
        workExperience: resumeData.experience?.items || [],
        education: resumeData.education,
        contactInfo: resumeData.contactInfo,
      });
    } catch (e) {
      console.error(e);
      return `<p style="color:red">Resume template error</p>`;
    }
  };

  const renderPortfolioHTML = () => {
    const fn = PORTFOLIO_TEMPLATES[portfolioTemplateName];
    if (!fn) return `<p>No portfolio template selected</p>`;
    try {
      return fn({
        githubUsername: resumeData.githubUsername,
        summary: resumeData.summary,
        categorizedSkills: resumeData.categorizedSkills,
        bestProjects: resumeData.projects?.items || [],
        workExperience: resumeData.experience?.items || [],
        education: resumeData.education,
        contactInfo: resumeData.contactInfo,
      });
    } catch (e) {
      console.error(e);
      return `<p style="color:red">Portfolio template error</p>`;
    }
  };

  /* ---------- EDITOR HELPERS ---------- */
  const addItem = (section) => {
    const newItem =
      section === "projects"
        ? { name: "New Project", html_url: "", description: "", technologies: [], stars: 0 }
        : { title: "Job Title", company: "Company", dates: "", description: "" };
    setResumeData(prev => ({
      ...prev,
      [section]: { ...(prev[section] || { items: [] }), items: [...(prev[section]?.items || []), newItem] },
    }));
  };

  const removeItem = (section, idx) => {
    setResumeData(prev => {
      const items = [...(prev[section]?.items || [])];
      items.splice(idx, 1);
      return { ...prev, [section]: { ...prev[section], items } };
    });
  };

  const beginPanelEdit = () => {
    originalRef.current = JSON.parse(JSON.stringify(resumeData));
    setShowEditorPanel(true);
  };
  const cancelPanelEdit = () => {
    if (originalRef.current) setResumeData(JSON.parse(JSON.stringify(originalRef.current)));
    setShowEditorPanel(false);
  };
  const savePanelEdit = () => setShowEditorPanel(false);

  const parseSkills = txt => {
    const out = {};
    txt.split(";").forEach(p => {
      const [cat, rest] = p.split(":").map(s => s.trim());
      if (cat && rest) out[cat] = rest.split(",").map(s => s.trim());
    });
    return out;
  };
  const skillsToText = () =>
    Object.entries(resumeData.categorizedSkills || {})
      .map(([k, v]) => `${k}: ${(Array.isArray(v) ? v : []).join(", ")}`)
      .join("; ");

  const updateProject = (i, field, val) => {
    setResumeData(prev => {
      const items = [...(prev.projects?.items || [])];
      items[i] = { ...items[i], [field]: val };
      return { ...prev, projects: { ...prev.projects, items } };
    });
  };
  const updateExperience = (i, field, val) => {
    setResumeData(prev => {
      const items = [...(prev.experience?.items || [])];
      items[i] = { ...items[i], [field]: val };
      return { ...prev, experience: { ...prev.experience, items } };
    });
  };

const handlePDF = async () => {
  setLocalLoading(true);
  try {
    await generateRealPDF(resumeData, templateName); // Pass data + template
  } catch (e) {
    console.error(e);
    setLocalError("PDF generation failed");
  } finally {
    setLocalLoading(false);
  }
};
  const handleGeneratePortfolio = async () => {
    setLocalLoading(true);
    try {
      const resp = await fetch("http://localhost:4000/api/generate-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: {
            githubUsername: resumeData.githubUsername,
            summary: resumeData.summary,
            skills: resumeData.categorizedSkills,
            projects: resumeData.projects,
            experience: resumeData.experience?.items || [],
            education: resumeData.education,
            contactInfo: resumeData.contactInfo,
            template: portfolioTemplateName,
          },
        }),
      });
      if (!resp.ok) throw new Error("Backend error");
      const { portfolioCode } = await resp.json();
      setPortfolioCode(portfolioCode);
      setActiveTab("portfolio");
    } catch (e) {
      setLocalError("Portfolio generation failed");
    } finally {
      setLocalLoading(false);
    }
  };

  const downloadPortfolioPreview = () => {
    const html = renderPortfolioHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resumeData.githubUsername.replace(/\s+/g, "_")}_preview.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- RENDER ---------- */
  if (localLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading…</p>
      </div>
    );
  }

  if (localError) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorCard}>
          <h2>Error</h2>
          <p>{localError}</p>
          <button style={styles.primaryBtn} onClick={() => navigate("/input")}>
            Back to Form
          </button>
        </div>
      </div>
    );
  }

  if (!resumeData.githubUsername) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorCard}>
          <p>No data – please fill the form again.</p>
          <button style={styles.primaryBtn} onClick={() => navigate("/input")}>
            Back to Form
          </button>
        </div>
      </div>
    );
  }

  /* ---------- TABS ---------- */
  const renderTabs = () => (
    <div style={styles.tabContainer}>
      <button
        style={{ ...styles.tabBtn, ...(activeTab === "resume" ? styles.activeTab : {}) }}
        onClick={() => setActiveTab("resume")}
      >
        Resume
      </button>
      <button
        style={{ ...styles.tabBtn, ...(activeTab === "portfolio" ? styles.activeTab : {}) }}
        onClick={() => setActiveTab("portfolio")}
      >
        Portfolio
      </button>
    </div>
  );

  /* ---------- RESUME TAB – ONLY THE TEMPLATE ---------- */
  const renderResumeTab = () => (
    <>
      {/* Controls header */}
      <div style={styles.headerCard}>
        <div style={styles.headerTop}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {resumeData.profilePictureUrl ? (
              <img
                src={resumeData.profilePictureUrl}
                alt="Profile"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #9333ea",
                }}
                onError={e => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  color: "#6b7280",
                  fontWeight: "bold",
                }}
              >
                {resumeData.githubUsername[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 36, fontWeight: "bold", margin: 0, color: "#111827" }}>
                {resumeData.githubUsername}
              </h1>
              <p style={{ margin: "8px 0 0", color: "#6b7280" }}>{resumeData.headline}</p>
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <select
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "2px solid #b08968",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              {RESUME_TEMPLATE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

{/* ⭐ ADD THIS BUTTON HERE ⭐ */}
  <button
    style={{ ...styles.primaryBtn, background: "#6D28D9", color: "#fff" }}
    onClick={() => navigate("/improve-experience")}
  >
    Improve Experience with AI
  </button>



            

            <button
              style={{ ...styles.primaryBtn, ...styles.pdfBtn }}
              onClick={handlePDF}
              disabled={localLoading}
            >
              {localLoading ? "Generating…" : "Download PDF"}
            </button>

            <button
              style={{ ...styles.primaryBtn, ...styles.editBtn }}
              onClick={showEditorPanel ? cancelPanelEdit : beginPanelEdit}
            >
              {showEditorPanel ? "Cancel Edit" : "Edit Resume"}
            </button>
            {showEditorPanel && (
              <button
                style={{ ...styles.primaryBtn, ...styles.generateBtn }}
                onClick={savePanelEdit}
              >
                Save Edits
              </button>
            )}
          </div>
        </div>
      </div>

      {/* THE REAL RESUME – full HTML from the chosen template */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: "bold", margin: "0 0 16px", color: "#111827" }}>
          Resume Preview
        </h2>
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,.1)",
            overflow: "hidden",
          }}
        >
          <iframe
            title="Resume Preview"
            style={{
              width: "100%",
              height: "900px",
              border: "none",
            }}
            srcDoc={renderResumeHTML()}
          />
        </div>
      </div>
    </>
  );

  /* ---------- PORTFOLIO TAB (unchanged) ---------- */
  const renderPortfolioTab = () => (
    <div style={styles.portfolioContainer}>
      <div style={styles.portfolioHeader}>
        <h2 style={styles.portfolioTitle}>Portfolio Preview</h2>
        <div style={styles.portfolioActions}>
          <select
            value={portfolioTemplateName}
            onChange={e => setPortfolioTemplateName(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd" }}
          >
            {Object.keys(PORTFOLIO_TEMPLATES).map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>

          <button style={styles.actionBtn} onClick={() => setActiveTab("resume")}>
            Back to Resume
          </button>

          <button
            style={styles.actionBtn}
            onClick={() => {
              navigator.clipboard.writeText(portfolioCode).then(() => alert("Backend code copied!"));
            }}
            disabled={!portfolioCode}
          >
            Copy Backend Code
          </button>

          <button
            style={styles.actionBtn}
            onClick={() => {
              const blob = new Blob([portfolioCode], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "portfolio_backend.html";
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!portfolioCode}
          >
            Download Backend HTML
          </button>

          <button style={styles.actionBtn} onClick={downloadPortfolioPreview}>
            Download Preview HTML
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={styles.codePreview}>
          <h3 style={{ margin: "0 0 12px", color: "#fff" }}>Generated Code</h3>
          <pre style={styles.codeBlock}>{portfolioCode || "Click “Generate Portfolio” first."}</pre>
        </div>

        <div style={{ background: "#fff", borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Live Preview</h3>
          <iframe
            title="Portfolio"
            style={styles.iframe}
            srcDoc={renderPortfolioHTML()}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );

  /* ---------- MAIN RETURN ---------- */
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {renderTabs()}
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            {activeTab === "resume" ? renderResumeTab() : renderPortfolioTab()}
          </div>

          {/* ---- EDITOR PANEL (kept for convenience) ---- */}
          {showEditorPanel && (
            <div style={styles.editorBox}>
              <strong>Edit Resume (instant preview)</strong>
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 14, display: "block", marginBottom: 4 }}>Name</label>
                <input
                  style={styles.input}
                  value={resumeData.githubUsername}
                  onChange={e => setResumeData(prev => ({ ...prev, githubUsername: e.target.value }))}
                />

                <label style={{ fontSize: 14, display: "block", marginBottom: 4 }}>Headline</label>
                <input
                  style={styles.input}
                  value={resumeData.headline}
                  onChange={e => setResumeData(prev => ({ ...prev, headline: e.target.value }))}
                />

                <label style={{ fontSize: 14, display: "block", marginBottom: 4 }}>Summary</label>
                <textarea
                  style={styles.textareaEditor}
                  value={resumeData.summary}
                  onChange={e => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                />

                <label style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
                  Skills (Category: a, b; …)
                </label>
                <textarea
                  style={styles.textareaEditor}
                  value={skillsToText()}
                  onChange={e =>
                    setResumeData(prev => ({
                      ...prev,
                      categorizedSkills: parseSkills(e.target.value),
                    }))
                  }
                />

                {/* Projects */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: 14 }}>Projects</label>
                    <button
                      style={{ ...styles.primaryBtn, background: "#10b981", padding: "6px 12px" }}
                      onClick={() => addItem("projects")}
                    >
                      Add
                    </button>
                  </div>
                  {resumeData.projects?.items?.map((p, i) => (
                    <div
                      key={i}
                      style={{ border: "1px solid #eee", borderRadius: 8, padding: 8, marginTop: 8 }}
                    >
                      <input style={styles.input} placeholder="Name" value={p.name} onChange={e => updateProject(i, "name", e.target.value)} />
                      <input style={styles.input} placeholder="URL" value={p.html_url} onChange={e => updateProject(i, "html_url", e.target.value)} />
                      <textarea style={styles.textareaEditor} rows={2} placeholder="Description" value={p.description} onChange={e => updateProject(i, "description", e.target.value)} />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                        <button
                          style={{ ...styles.primaryBtn, background: "#ef4444", padding: "4px 8px" }}
                          onClick={() => removeItem("projects", i)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Experience */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: 14 }}>Experience</label>
                    <button
                      style={{ ...styles.primaryBtn, background: "#10b981", padding: "6px 12px" }}
                      onClick={() => addItem("experience")}
                    >
                      Add
                    </button>
                  </div>
                  {resumeData.experience?.items?.map((e, i) => (
                    <div
                      key={i}
                      style={{ border: "1px solid #eee", borderRadius: 8, padding: 8, marginTop: 8 }}
                    >
                      <input style={styles.input} placeholder="Title" value={e.title} onChange={ev => updateExperience(i, "title", ev.target.value)} />
                      <input style={styles.input} placeholder="Company" value={e.company} onChange={ev => updateExperience(i, "company", ev.target.value)} />
                      <input style={styles.input} placeholder="Dates" value={e.dates} onChange={ev => updateExperience(i, "dates", ev.target.value)} />
                      <textarea style={styles.textareaEditor} rows={2} placeholder="Description" value={e.description} onChange={ev => updateExperience(i, "description", ev.target.value)} />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                        <button
                          style={{ ...styles.primaryBtn, background: "#ef4444", padding: "4px 8px" }}
                          onClick={() => removeItem("experience", i)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

{/* Education */}
<div style={{ marginTop: 16 }}>
  <label style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
    Education
  </label>
  <textarea
    style={styles.textareaEditor}
    placeholder="e.g., B.Tech in CSE, XYZ University, 2020–2024"
    value={resumeData.education}
    onChange={(e) =>
      setResumeData((prev) => ({
        ...prev,
        education: e.target.value,
      }))
    }
  />
</div>



                {/* Contact */}
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 14, display: "block", marginBottom: 4 }}>Contact</label>
                  <input
                    style={styles.input}
                    placeholder="Email"
                    value={resumeData.contactInfo.email}
                    onChange={e =>
                      setResumeData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, email: e.target.value },
                      }))
                    }
                  />
                  <input
                    style={styles.input}
                    placeholder="Mobile"
                    value={resumeData.contactInfo.mobile}
                    onChange={e =>
                      setResumeData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, mobile: e.target.value },
                      }))
                    }
                  />
                  <input
                    style={styles.input}
                    placeholder="LinkedIn"
                    value={resumeData.contactInfo.linkedin}
                    onChange={e =>
                      setResumeData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, linkedin: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}