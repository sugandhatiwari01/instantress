import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import "./App.css";

function App() {
  const [githubUser, setGithubUser] = useState("");
  const [leetcodeUser, setLeetcodeUser] = useState("");
  const [workExperience, setWorkExperience] = useState([{ title: "", company: "", dates: "", description: "" }]);
  const [education, setEducation] = useState({ degree: "", institution: "", year: "", dates: "", gpa: "" });
  const [data, setData] = useState(null);
  const [aiOverview, setAiOverview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("ATS-friendly");

  const fetchData = async () => {
    if (!githubUser) {
      setError("Please enter GitHub username");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:4000/api/process-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUser, leetcodeUser, workExperience, education }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setData(data);
      setAiOverview(DOMPurify.sanitize(data.summary || `AI Overview for ${githubUser}: ...`));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResumePDF = async () => {
    const res = await fetch("http://localhost:4000/api/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, template: selectedTemplate }),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${githubUser || "resume"}.pdf`;
    a.click();
  };

  const downloadResumeDOCX = async () => {
    const res = await fetch("http://localhost:4000/api/export-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, template: selectedTemplate }),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${githubUser || "resume"}.docx`;
    a.click();
  };

  const downloadPortfolioZIP = async () => {
    const res = await fetch("http://localhost:4000/api/export-portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, template: selectedTemplate }),
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio.zip`;
    a.click();
  };

  useEffect(() => {
    if (data) {
      const html = `<div>${getTemplateHTML(data, selectedTemplate)}</div>`;
      const previewDiv = document.getElementById("preview");
      if (previewDiv) {
        previewDiv.innerHTML = DOMPurify.sanitize(html);
      }
    }
  }, [data, selectedTemplate]);

  const getTemplateHTML = (data, template) => {
    // For preview, we can reuse a simplified version of the backend HTML generation, but add the styles inline
    const styles = {
      Minimal: `
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
      `,
      Modern: `
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
    let html = `<style>${styles[template] || styles.Minimal}</style>`;
    html += `<h1>${data.githubUser || "Your Name"}'s Resume</h1>`;
    html += `<div class="section"><p>${data.summary || "Summary placeholder"}</p></div>`;
    html += `<div class="section"><h2>Skills</h2>`;
    Object.entries(data.categorizedSkills || {}).forEach(([category, items]) => {
      html += `<h3>${category}</h3><ul>${(items || []).map(s => `<li>${s}</li>`).join("") || "<li>No items</li>"}</ul>`;
    });
    html += `</div>`;
    html += `<div class="section"><h2>Projects</h2>` + 
    ((data.bestProjects && data.bestProjects.length > 0)
      ? data.bestProjects.map(p => 
          `<div class="project"><strong>${p.name}</strong> - ${p.description.replace(/\n/g, '<br>')} 
           (<a href="${p.html_url}">Link</a>, Stars: ${p.stargazers_count})</div>`
        ).join("")
      : "<p>No projects</p>") + `</div>`;
    html += `<div class="section"><h2>Experience</h2>${(data.workExperience || []).map(exp => `<p><strong>${exp.title} at ${exp.company}</strong> (${exp.dates})<br>${exp.description}</p>`).join("") || "<p>No experience</p>"}</div>`;
    html += `<div class="section"><h2>Education</h2><p>${data.education || "No education"}</p></div>`;
    return html;
  };

  const addExperience = () => {
    setWorkExperience([...workExperience, { title: "", company: "", dates: "", description: "" }]);
  };

  const updateExperience = (index, field, value) => {
    const newExperience = [...workExperience];
    newExperience[index][field] = value;
    setWorkExperience(newExperience);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Instant Resume Generator</h1>
      </header>
      <main className="main-content">
        <section className="input-section">
          <div className="form-group">
            <label htmlFor="githubUser">GitHub Username:</label>
            <input
              id="githubUser"
              type="text"
              value={githubUser}
              onChange={(e) => setGithubUser(e.target.value)}
              placeholder="e.g., sugandhatiwari01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="leetcodeUser">LeetCode Username (optional, for C/C++ skills):</label>
            <input
              id="leetcodeUser"
              type="text"
              value={leetcodeUser}
              onChange={(e) => setLeetcodeUser(e.target.value)}
              placeholder="e.g., user123"
            />
          </div>
          <div className="form-group">
            <label>Education:</label>
            <div className="education-inputs">
              <input
                type="text"
                value={education.degree}
                onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                placeholder="Degree (e.g., B.Tech)"
              />
              <input
                type="text"
                value={education.institution}
                onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                placeholder="Institution (e.g., JIIT)"
              />
              <input
                type="text"
                value={education.year}
                onChange={(e) => setEducation({ ...education, year: e.target.value })}
                placeholder="Graduation Year (e.g., 2027)"
              />
              <input
                type="text"
                value={education.dates}
                onChange={(e) => setEducation({ ...education, dates: e.target.value })}
                placeholder="Dates (optional, e.g., 2023 - 2027)"
              />
              <input
                type="text"
                value={education.gpa}
                onChange={(e) => setEducation({ ...education, gpa: e.target.value })}
                placeholder="GPA (optional, e.g., 8.5)"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Work Experience:</label>
            {workExperience.map((exp, index) => (
              <div key={index} className="experience-group">
                <div className="experience-row">
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => updateExperience(index, "title", e.target.value)}
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    placeholder="Company"
                  />
                  <input
                    type="text"
                    value={exp.dates}
                    onChange={(e) => updateExperience(index, "dates", e.target.value)}
                    placeholder="Dates"
                  />
                </div>
                <input
                  type="text"
                  value={exp.description}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  placeholder="Description"
                />
              </div>
            ))}
            <button onClick={addExperience} className="add-btn">Add Experience</button>
          </div>
          <div className="form-group">
            <label htmlFor="template">Template:</label>
            <select
              id="template"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {["Minimal", "ATS-friendly", "Modern"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button onClick={fetchData} disabled={isLoading} className="fetch-btn">
            {isLoading ? "Loading..." : "Fetch Data & Generate Resume"}
          </button>
          {error && <div className="error">{error}</div>}
          {isLoading && <div className="loading">Loading data...</div>}
        </section>
        {data && (
          <section className="preview-section">
            <div className="preview" id="preview"></div>
            <div className="download-buttons">
              <button onClick={downloadResumePDF} className="download-btn">Download Resume (PDF)</button>
              <button onClick={downloadResumeDOCX} className="download-btn">Download Resume (DOCX)</button>
              <button onClick={downloadPortfolioZIP} className="download-btn">Download Portfolio (ZIP)</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;