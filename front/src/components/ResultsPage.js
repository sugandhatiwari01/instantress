// src/components/ResultsPage.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { handleDownloadAndOpenPDF } from "./handleDownloadAndOpenPDF";
import "./ResultsPage.css"; // keep your css
import atsTemplate from "../templates/resume/ats";
import creativeTemplate from "../templates/resume/creative";
import minimalTemplate from "../templates/resume/minimal";
import modernTemplate from "../templates/resume/modern";
import sidebarTemplate from "../templates/resume/sidebar";

// portfolio template imports (make sure these files exist)
import darkneonTemplate from "../templates/portfolio/darkneon";
import glassTemplate from "../templates/portfolio/glass";
import gridTemplate from "../templates/portfolio/grid";
import minimalPortfolioTemplate from "../templates/portfolio/minimal";

import { useAuth } from "../context/AuthContext";

const TEMPLATES = {
  "ATS-friendly": atsTemplate,
  Creative: creativeTemplate,
  Minimal: minimalTemplate,
  Modern: modernTemplate,
  Sidebar: sidebarTemplate,
};

const PORTFOLIO_TEMPLATES = {
  "Dark Neon": darkneonTemplate,
  "Glass Morphism": glassTemplate,
  "Grid Layout": gridTemplate,
  "Minimal Clean": minimalPortfolioTemplate,
};

const baseStyles = {
  container: { minHeight: "100vh", padding: 24, background: "linear-gradient(135deg,#f5f3ff,#ede9fe)" },
  contentWrap: { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: 20 },
  topBar: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" },
  btn: { padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700 },
  mainArea: { display: "flex", gap: 16 },
  previewBox: { flex: 1, background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 6px 20px rgba(0,0,0,.08)" },
  editorBox: { width: 420, background: "#fff", borderRadius: 12, padding: 12, boxShadow: "0 6px 20px rgba(0,0,0,.08)" },
  iframe: { width: "100%", height: "75vh", border: "none", borderRadius: 8 },
  input: { width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", marginBottom: 8 },
  textarea: { width: "100%", padding: 8, minHeight: 96, borderRadius: 6, border: "1px solid #ddd", marginBottom: 8 },
  sectionTitle: { fontSize: 16, margin: "8px 0" },
  smallNote: { fontSize: 12, color: "#666" },
};

export default function ResultsPage({
  data = {},
  aiOverview = "",
  selectedTemplate = "ATS-friendly",
}) {
  const navigate = useNavigate();
  const auth = useAuth?.() || {};
  const user = auth.user || null;

  const [resumeData, setResumeData] = useState({
    githubUsername: "Your Name",
    headline: "Software Developer",
    summary: "",
    categorizedSkills: {},
    projects: { items: [] },
    experience: { items: [] },
    education: "",
    contactInfo: { email: "", mobile: "", linkedin: "" },
  });

  const [templateName, setTemplateName] = useState(selectedTemplate || "ATS-friendly");
  const [portfolioTemplateName, setPortfolioTemplateName] = useState("Dark Neon"); // fancy default
  const [activeTab, setActiveTab] = useState("resume"); // resume | portfolio
  const [portfolioCode, setPortfolioCode] = useState("");
  const [editing, setEditing] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");
  const iframeRef = useRef(null);
  const originalRef = useRef(null);

  // normalize incoming data
  useEffect(() => {
    const fromBackend = data || {};
    const githubUsername =
      fromBackend.fullName ||
      fromBackend.name ||
      fromBackend.githubUsername ||
      (user && (user.fullName || user.name)) ||
      "Your Name";

    const contactInfo = {
      email: (fromBackend.contactInfo && fromBackend.contactInfo.email) || fromBackend.email || (user && user.email) || "",
      mobile: (fromBackend.contactInfo && fromBackend.contactInfo.mobile) || fromBackend.contactInfo?.mobile || "",
      linkedin: (fromBackend.contactInfo && fromBackend.contactInfo.linkedin) || fromBackend.contactInfo?.linkedin || "",
    };

    const categorizedSkills = fromBackend.categorizedSkills || fromBackend.skills || fromBackend.skillsSummary || {};

    const projects = {
      items: (fromBackend.bestProjects || fromBackend.projects?.items || fromBackend.projects || []).map(p => ({
        name: p.name || p.title || "",
        html_url: p.url || p.html_url || p.link || "",
        description: p.description || p.desc || "",
        technologies: p.technologies || p.tech || [],
        stars: p.stars || p.stargazers_count || 0,
      }))
    };

    const experienceItems = (fromBackend.workExperience || fromBackend.experience || []).map(e => ({
      title: e.title || e.position || "",
      company: e.company || e.org || "",
      dates: e.dates || e.range || "",
      description: e.description || e.summary || "",
    }));

    const normalized = {
      githubUsername,
      headline: fromBackend.headline || user?.headline || "Software Developer",
      summary: fromBackend.summary || aiOverview || "",
      categorizedSkills,
      projects,
      experience: { items: experienceItems },
      education: fromBackend.education || fromBackend.educationString || "",
      contactInfo,
    };

    originalRef.current = JSON.parse(JSON.stringify(normalized));
    setResumeData(normalized);

    if (fromBackend.template) setTemplateName(fromBackend.template);
  }, [data, user, aiOverview]);

  // generate resume HTML using chosen resume template
  const generateResumeHTML = () => {
    const templateFn = TEMPLATES[templateName] || minimalTemplate;
    try {
      return templateFn({
        githubUsername: resumeData.githubUsername,
        summary: resumeData.summary,
        categorizedSkills: resumeData.categorizedSkills,
        projects: resumeData.projects,
        workExperience: resumeData.experience?.items || [],
        education: resumeData.education,
        contactInfo: resumeData.contactInfo,
      });
    } catch (err) {
      console.error("Template render failed:", err);
      return `<html><body><p style="color:red">Error rendering template.</p></body></html>`;
    }
  };

  // generate portfolio HTML using selected portfolio template (client-side preview)
  const generatePortfolioPreviewHTML = () => {
    const fn = PORTFOLIO_TEMPLATES[portfolioTemplateName];
    if (!fn) return "<html><body><p>No portfolio template found.</p></body></html>";
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
    } catch (err) {
      console.error("Portfolio template render failed:", err);
      return `<html><body><p style="color:red">Error rendering portfolio template.</p></body></html>`;
    }
  };

  const currentResumeHTML = generateResumeHTML();
  const currentPortfolioHTML = generatePortfolioPreviewHTML();

  // Backend portfolio generation unchanged
  const handleGeneratePortfolio = async () => {
    setLocalLoading(true);
    setError("");
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
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      const json = await resp.json();
      setPortfolioCode(json.portfolioCode || "");
      setActiveTab("portfolio");
      alert("Portfolio generated by backend. Use the copy/download (backend) buttons if needed.");
    } catch (err) {
      console.error(err);
      setError("Failed to generate portfolio: " + (err.message || "unknown"));
    } finally {
      setLocalLoading(false);
    }
  };

  // PDF generation keeps using your helper
  const handlePDF = async () => {
    setLocalLoading(true);
    setError("");
    try {
      const pdfDoc = {
        data: resumeData,
        template: templateName,
      };
      await handleDownloadAndOpenPDF(pdfDoc);
    } catch (err) {
      console.error(err);
      setError("Failed to generate PDF");
    } finally {
      setLocalLoading(false);
    }
  };

  // Download currently previewed portfolio HTML (client-side)
  const handleDownloadPortfolioPreview = () => {
    try {
      const html = currentPortfolioHTML || "<html><body></body></html>";
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(resumeData.githubUsername || "portfolio").replace(/\s+/g, "_").toLowerCase()}_${portfolioTemplateName.replace(/\s+/g, "_")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download portfolio failed", err);
      setError("Download failed");
    }
  };

  // Editor helpers
  const beginEdit = () => {
    originalRef.current = JSON.parse(JSON.stringify(resumeData));
    setEditing(true);
  };
  const cancelEdit = () => {
    if (originalRef.current) setResumeData(JSON.parse(JSON.stringify(originalRef.current)));
    setEditing(false);
  };
  const saveEdit = () => {
    setEditing(false);
  };

  // small helpers
  const parseSkillsText = (text) => {
    const out = {};
    text.split(";").forEach(part => {
      const p = part.trim();
      if (!p) return;
      const [cat, rest] = p.split(":").map(s => s && s.trim());
      if (!rest) {
        out["Skills"] = (out["Skills"] || []).concat(p.split(",").map(s => s.trim()).filter(Boolean));
      } else {
        out[cat || "Skills"] = rest.split(",").map(s => s.trim()).filter(Boolean);
      }
    });
    return out;
  };

  const skillsTextFromData = () =>
    Object.entries(resumeData.categorizedSkills || {})
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("; ");

  // project/experience array helpers
  const updateProjectField = (index, field, value) => {
    setResumeData(prev => {
      const items = [...(prev.projects?.items || [])];
      items[index] = { ...(items[index] || {}), [field]: value };
      return { ...prev, projects: { items } };
    });
  };
  const addProject = () => setResumeData(prev => ({ ...prev, projects: { items: [ ...(prev.projects?.items || []), { name: "New Project", html_url: "", description: "" } ] } }));
  const removeProject = (index) => setResumeData(prev => { const items = [...(prev.projects?.items || [])]; items.splice(index, 1); return { ...prev, projects: { items } }; });

  const updateExperienceField = (index, field, value) => {
    setResumeData(prev => {
      const items = [...(prev.experience?.items || [])];
      items[index] = { ...(items[index] || {}), [field]: value };
      return { ...prev, experience: { items } };
    });
  };
  const addExperience = () => setResumeData(prev => ({ ...prev, experience: { items: [ ...(prev.experience?.items || []), { title: "Title", company: "Company", dates: "", description: "" } ] } }));
  const removeExperience = (index) => setResumeData(prev => { const items = [...(prev.experience?.items || [])]; items.splice(index, 1); return { ...prev, experience: { items } }; });

  return (
    <div style={baseStyles.container}>
      <div style={baseStyles.contentWrap}>
        <div style={baseStyles.topBar}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>{resumeData.githubUsername || "Your Name"}</h2>
            <div style={{ color: "#666" }}>{resumeData.headline}</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Resume template selector (small) */}
            <select
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={{
                height: "48px",
                padding: "0 18px",
                borderRadius: 12,
                border: "2px solid #b08968",
                background: "#fff",
                fontSize: 15,
                fontWeight: 700,
                color: "#7a5836",
                cursor: "pointer",
                boxShadow: "0 3px 8px rgba(176,137,104,0.15)",
              }}
            >
              {Object.keys(TEMPLATES).map(key => <option key={key} value={key}>{key}</option>)}
            </select>

            {/* Portfolio dropdown - same visual style and size as buttons */}
            <select
              value={portfolioTemplateName}
              onChange={(e) => setPortfolioTemplateName(e.target.value)}
              style={{
                height: "48px",
                padding: "0 18px",
                borderRadius: 12,
                border: "2px solid #b08968",
                background: "#fff",
                fontSize: 15,
                fontWeight: 700,
                color: "#7a5836",
                cursor: "pointer",
                boxShadow: "0 3px 8px rgba(176,137,104,0.15)",
              }}
            >
              {Object.keys(PORTFOLIO_TEMPLATES).map(name => <option key={name} value={name}>{name}</option>)}
            </select>

            <button
              style={{ ...baseStyles.btn, background: "#b08968", color: "#fff" }}
              onClick={handleGeneratePortfolio}
              disabled={localLoading}
            >
              {localLoading ? "Generating..." : "Generate Portfolio"}
            </button>

            <button
              style={{ ...baseStyles.btn, background: "#b08968", color: "#fff" }}
              onClick={handlePDF}
              disabled={localLoading}
            >
              Download PDF
            </button>

            <button
              style={{ ...baseStyles.btn, background: editing ? "#c9c0b1" : "#7a5836", color: "#fff" }}
              onClick={() => (editing ? cancelEdit() : beginEdit())}
            >
              {editing ? "Cancel Edit" : "Edit Resume"}
            </button>

            {editing && (
              <button
                style={{ ...baseStyles.btn, background: "#b08968", color: "#fff" }}
                onClick={saveEdit}
              >
                Save Edits
              </button>
            )}
          </div>
        </div>

        <div style={baseStyles.mainArea}>
          {/* Preview column: showing resume or portfolio preview */}
          <div style={baseStyles.previewBox}>
            {/* top controls for switching resume/portfolio (no "Preview" title) */}
            <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{
                    ...baseStyles.btn,
                    background: activeTab === "resume" ? "#4f46e5" : "#fff",
                    color: activeTab === "resume" ? "#fff" : "#000",
                    border: "1px solid #ddd"
                  }}
                  onClick={() => setActiveTab("resume")}
                >
                  Resume
                </button>
                <button
                  style={{
                    ...baseStyles.btn,
                    background: activeTab === "portfolio" ? "#4f46e5" : "#fff",
                    color: activeTab === "portfolio" ? "#fff" : "#000",
                    border: "1px solid #ddd"
                  }}
                  onClick={() => setActiveTab("portfolio")}
                >
                  Portfolio
                </button>
              </div>

              {/* When portfolio tab active, show download of preview (client-side) and backend copy/download if available */}
              {activeTab === "portfolio" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ ...baseStyles.btn, background: "#b08968", color: "#fff" }}
                    onClick={handleDownloadPortfolioPreview}
                  >
                    Download Portfolio (Preview)
                  </button>

                  {/* if backend portfolioCode exists (from handleGeneratePortfolio), allow copy/download */}
                  <button
                    style={{ ...baseStyles.btn, background: portfolioCode ? "#7a5836" : "#9ca3af", color: "#fff" }}
                    onClick={() => {
                      if (!portfolioCode) { alert("No backend-generated portfolio available. Click 'Generate Portfolio' first."); return; }
                      navigator.clipboard.writeText(portfolioCode).then(() => alert("Backend portfolio HTML copied to clipboard"));
                    }}
                    disabled={!portfolioCode}
                  >
                    Copy Backend Portfolio
                  </button>

                  <button
                    style={{ ...baseStyles.btn, background: portfolioCode ? "#b08968" : "#9ca3af", color: "#fff" }}
                    onClick={() => {
                      if (!portfolioCode) { alert("No backend-generated portfolio available. Click 'Generate Portfolio' first."); return; }
                      const blob = new Blob([portfolioCode], {type: "text/html"});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = `${(resumeData.githubUsername || "portfolio").replace(/\s+/g,"_").toLowerCase()}_backend.html`;
                      a.click(); URL.revokeObjectURL(url);
                    }}
                    disabled={!portfolioCode}
                  >
                    Download Backend Portfolio
                  </button>
                </div>
              )}
            </div>

            {activeTab === "resume" ? (
              <iframe
                title="Resume Preview"
                ref={iframeRef}
                style={baseStyles.iframe}
                srcDoc={currentResumeHTML}
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <iframe
                title="Portfolio Preview"
                style={baseStyles.iframe}
                srcDoc={currentPortfolioHTML}
                sandbox="allow-same-origin allow-scripts"
              />
            )}
          </div>

          {/* Editor column (toggle) */}
          {editing && (
            <div style={baseStyles.editorBox}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>Edit Resume</strong>
                <div style={baseStyles.smallNote}>Edits update preview instantly</div>
              </div>

              <div style={{ marginTop: 8 }}>
                <label style={baseStyles.sectionTitle}>Name</label>
                <input
                  style={baseStyles.input}
                  value={resumeData.githubUsername}
                  onChange={(e) => setResumeData(prev => ({ ...prev, githubUsername: e.target.value }))}
                />

                <label style={baseStyles.sectionTitle}>Headline</label>
                <input
                  style={baseStyles.input}
                  value={resumeData.headline}
                  onChange={(e) => setResumeData(prev => ({ ...prev, headline: e.target.value }))}
                />

                <label style={baseStyles.sectionTitle}>Summary</label>
                <textarea
                  style={baseStyles.textarea}
                  value={resumeData.summary}
                  onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                />

                <label style={baseStyles.sectionTitle}>Skills (format: Category: a, b; Category2: c, d)</label>
                <textarea
                  style={baseStyles.textarea}
                  value={skillsTextFromData()}
                  onChange={(e) => {
                    const parsed = parseSkillsText(e.target.value);
                    setResumeData(prev => ({ ...prev, categorizedSkills: parsed }));
                  }}
                />

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={baseStyles.sectionTitle}>Projects</label>
                    <button style={{ ...baseStyles.btn, background: "#10b981", color: "#fff" }} onClick={addProject}>Add</button>
                  </div>

                  <div style={{ maxHeight: 220, overflow: "auto", paddingRight: 6 }}>
                    {(resumeData.projects?.items || []).map((p, i) => (
                      <div key={i} style={{ border: "1px solid #eee", padding: 8, borderRadius: 8, marginBottom: 8 }}>
                        <input style={baseStyles.input} value={p.name} onChange={(e) => updateProjectField(i, "name", e.target.value)} placeholder="Project name" />
                        <input style={baseStyles.input} value={p.html_url} onChange={(e) => updateProjectField(i, "html_url", e.target.value)} placeholder="URL" />
                        <textarea style={{ ...baseStyles.textarea, minHeight: 60 }} value={p.description} onChange={(e) => updateProjectField(i, "description", e.target.value)} />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button style={{ ...baseStyles.btn, background: "#ef4444", color: "#fff" }} onClick={() => removeProject(i)}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={baseStyles.sectionTitle}>Experience</label>
                    <button style={{ ...baseStyles.btn, background: "#10b981", color: "#fff" }} onClick={addExperience}>Add</button>
                  </div>

                  <div style={{ maxHeight: 220, overflow: "auto", paddingRight: 6 }}>
                    {(resumeData.experience?.items || []).map((e, i) => (
                      <div key={i} style={{ border: "1px solid #eee", padding: 8, borderRadius: 8, marginBottom: 8 }}>
                        <input style={baseStyles.input} value={e.title} onChange={(ev) => updateExperienceField(i, "title", ev.target.value)} placeholder="Title" />
                        <input style={baseStyles.input} value={e.company} onChange={(ev) => updateExperienceField(i, "company", ev.target.value)} placeholder="Company" />
                        <input style={baseStyles.input} value={e.dates} onChange={(ev) => updateExperienceField(i, "dates", ev.target.value)} placeholder="Dates" />
                        <textarea style={{ ...baseStyles.textarea, minHeight: 60 }} value={e.description} onChange={(ev) => updateExperienceField(i, "description", ev.target.value)} />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button style={{ ...baseStyles.btn, background: "#ef4444", color: "#fff" }} onClick={() => removeExperience(i)}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={baseStyles.sectionTitle}>Education (free text)</label>
                  <textarea style={baseStyles.textarea} value={resumeData.education} onChange={(e) => setResumeData(prev => ({ ...prev, education: e.target.value }))} />
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={baseStyles.sectionTitle}>Contact</label>
                  <input style={baseStyles.input} placeholder="Email" value={resumeData.contactInfo.email} onChange={(e) => setResumeData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))} />
                  <input style={baseStyles.input} placeholder="Mobile" value={resumeData.contactInfo.mobile} onChange={(e) => setResumeData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, mobile: e.target.value } }))} />
                  <input style={baseStyles.input} placeholder="LinkedIn" value={resumeData.contactInfo.linkedin} onChange={(e) => setResumeData(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, linkedin: e.target.value } }))} />
                </div>
              </div>
            </div>
          )}

        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#fff", boxShadow: "0 6px 20px rgba(0,0,0,.06)" }}>
            <strong style={{ color: "#b91c1c" }}>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}
