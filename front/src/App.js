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
      body: JSON.stringify({ ...data, template: selectedTemplate, githubUser, education }),
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
      body: JSON.stringify({ ...data, template: selectedTemplate, githubUser, education }),
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
      body: JSON.stringify({ ...data, template: selectedTemplate, githubUser, education }),
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
    let html = `<h1>${data.githubUser || "Your Name"}'s Resume</h1>`;
    html += `<p>${data.summary || "Summary placeholder"}</p>`;
    html += `<h2>Skills</h2>`;
    Object.entries(data.categorizedSkills || {}).forEach(([category, items]) => {
      html += `<h3>${category}</h3><ul>${(items || []).map(s => `<li>${s}</li>`).join("") || "<li>No items</li>"}</ul>`;
    });
    html += `<h2>Projects</h2>${(data.bestProjects || []).map(p => `<p><strong>${p.name}</strong> - ${p.description} (<a href="${p.url}">Link</a>, Stars: ${p.stars})</p>`).join("") || "<p>No projects</p>"}`;
    html += `<h2>Experience</h2>${(data.workExperience || []).map(exp => `<p><strong>${exp.title} at ${exp.company}</strong> (${exp.dates})<br>${exp.description}</p>`).join("") || "<p>No experience</p>"}`;
    html += `<h2>Education</h2><p>${data.education || "No education"}</p>`;
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