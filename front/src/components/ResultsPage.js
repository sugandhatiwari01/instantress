import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumePDF from './ResumePDF';
import { handleDownloadAndOpenPDF } from './handleDownloadAndOpenPDF';
import 'react-quill/dist/quill.snow.css';
import './ResultsPage.css';

const ResultsPage = ({ data, error: initialError, isLoading: initialIsLoading, aiOverview, selectedTemplate }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resume');
  const [localError, setLocalError] = useState(initialError || '');
  const [localIsLoading, setLocalIsLoading] = useState(initialIsLoading || false);

  // CSS Injection for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      button:hover { opacity: 0.9; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [portfolioCode, setPortfolioCode] = useState('');
  const [resumeData, setResumeData] = useState({});
  const [isEditing, setIsEditing] = useState({});
  const [editValues, setEditValues] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    skills: true,
    projects: true,
    experience: true,
    education: true,
    certifications: true,
    hobbies: true,
  });

  // === Initialize resume data ===
  useEffect(() => {
    if (!data) {
      if (!initialIsLoading) setLocalError('No data available');
      return;
    }

    if (typeof data !== 'object') {
      setLocalError('Invalid data format');
      return;
    }

    // Normalize projects and transform bestProjects to projects format
    const normalizedData = {
      ...data,
      projects: {
        title: 'Projects',
        items: (data.bestProjects || []).map(project => ({
          name: project.name,
          html_url: project.url,
          description: project.description,
          technologies: project.technologies || [],
          stars: project.stars
        }))
      },
      experience: data.workExperience && Array.isArray(data.workExperience)
        ? { title: 'Experience', items: data.workExperience }
        : { title: 'Experience', items: [] },
    };

    setResumeData(normalizedData);
    setLocalError('');
    setExpandedSections({
      summary: true,
      skills: true,
      projects: true,
      experience: true,
      education: true,
      certifications: true,
      hobbies: true,
    });
  }, [data, initialIsLoading, aiOverview, selectedTemplate]);

  // === Handle PDF Generation ===
  const handleGeneratePDF = async () => {
    try {
      setLocalIsLoading(true);
      const pdfDocument = (
        <ResumePDF
          data={resumeData}
          selectedTemplate={selectedTemplate}
          aiOverview={aiOverview}
        />
      );
      await handleDownloadAndOpenPDF(pdfDocument);
      await handleDownloadAndOpenPDF(pdfDocument);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setLocalError('Failed to generate PDF. Please try again.');
    } finally {
      setLocalIsLoading(false);
    }
  };

  // === Format Helpers ===
  const formatEducation = (edu) => {
    if (typeof edu === 'string') return edu;
    if (edu?.degree && edu?.institution) {
      return `${edu.degree}, ${edu.institution}${edu.dates ? ` (${edu.dates})` : ''}${edu.gpa ? `; GPA: ${edu.gpa}` : ''}`;
    }
    return 'No education details';
  };

  const formatHobbies = (hobbies) => {
    if (hobbies?.content) return hobbies.content;
    if (hobbies?.items) return hobbies.items.join(', ');
    return 'No hobbies listed';
  };

  const formatCustomSection = (section) => {
    if (!section) return 'No content';
    if (typeof section === 'string') return section;
    if (section.content) return section.content;
    if (Array.isArray(section.items)) return section.items.join('\n');
    return 'No content';
  };

  // === Generate Portfolio ===
  const handleGeneratePortfolio = async () => {
    try {
      setLocalIsLoading(true);
      const response = await fetch('http://localhost:5000/api/generate-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: {
            ...resumeData,
            github: resumeData.githubData || data?.githubData,
            leetcode: resumeData.leetcodeData || data?.leetcodeData,
            linkedin: resumeData.linkedinInfo || data?.linkedinInfo,
          },
        }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setPortfolioCode(result.data.portfolioCode);
      setActiveTab('portfolio');
    } catch (error) {
      setLocalError('Error generating portfolio: ' + error.message);
    } finally {
      setLocalIsLoading(false);
    }
  };

  // === Handle PDF Generation ===
  const handlePDFGeneration = async () => {
    try {
      setLocalIsLoading(true);
      setLocalError('');
      const pdfDocument = (
        <ResumePDF
          data={resumeData}
          selectedTemplate={selectedTemplate}
          aiOverview={aiOverview}
        />
      );
      await handleDownloadAndOpenPDF(pdfDocument);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setLocalError('Failed to generate PDF');
    } finally {
      setLocalIsLoading(false);
    }
  };

  // === Toggle Section ===
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // === Start Editing ===
  const startEditing = (section, index = null, field = null) => {
    const key = index !== null ? `${section}_${index}_${field}` : section;
    setIsEditing((prev) => ({ ...prev, [key]: true }));

    let value = '';
    if (index !== null) {
      value = resumeData[section.toLowerCase()]?.items[index]?.[field] || '';
    } else if (section === 'Skills' || section === 'Certifications') {
      value = (resumeData[section.toLowerCase()]?.items || []).join(', ');
    } else if (section === 'ContactInfo') {
      const fieldName = field.split('.').pop();
      value = resumeData.contactInfo?.[fieldName] || '';
    } else if (section === 'Education') {
      value = formatEducation(resumeData.education);
    } else if (section === 'Hobbies') {
      value = formatHobbies(resumeData.hobbies);
    } else if (section === 'Summary') {
      value = resumeData.summary || aiOverview || '';
    } else {
      value = formatCustomSection(resumeData.customSections?.[section]);
    }
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  // === Save Edit ===
  const saveEdit = (section, index = null, field = null) => {
    const key = index !== null ? `${section}_${index}_${field}` : section;
    const value = editValues[key] || '';
    const updatedData = { ...resumeData };

    if (index !== null) {
      const items = [...(updatedData[section.toLowerCase()]?.items || [])];
      items[index] = { ...items[index], [field]: field === 'stargazers_count' ? parseInt(value) || 0 : value };
      updatedData[section.toLowerCase()] = { items };
    } else if (section === 'Skills' || section === 'Certifications') {
      const items = value.split(',').map((s) => s.trim()).filter(Boolean);
      updatedData[section.toLowerCase()] = { items };
    } else if (section === 'ContactInfo') {
      const fieldName = field.split('.').pop();
      updatedData.contactInfo = { ...updatedData.contactInfo, [fieldName]: value };
    } else if (section === 'Education') {
      updatedData.education = value;
    } else if (section === 'Hobbies') {
      updatedData.hobbies = { content: value };
    } else if (section === 'Summary') {
      updatedData.summary = value;
    } else {
      updatedData.customSections = {
        ...updatedData.customSections,
        [section]: { content: value },
      };
    }

    setResumeData(updatedData);
    setIsEditing((prev) => ({ ...prev, [key]: false }));
  };

  // === Add Item ===
  const addItem = (section) => {
    const key = section === 'Projects' ? 'projects' : 'experience';
    const newItem =
      section === 'Projects'
        ? {
            name: 'New Project',
            html_url: '',
            description: 'Project description',
            language: 'JavaScript',
            stargazers_count: 0,
          }
        : {
            title: 'Job Title',
            company: 'Company Name',
            dates: '2024 - Present',
            description: 'Job description',
          };

    setResumeData((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { items: [] }),
        items: [...(prev[key]?.items || []), newItem],
      },
    }));
  };

  // === Remove Item ===
  const removeItem = (section, index) => {
    const key = section === 'Projects' ? 'projects' : 'experience';
    setResumeData((prev) => {
      const items = [...(prev[key]?.items || [])];
      items.splice(index, 1);
      return { ...prev, [key]: { ...prev[key], items } };
    });
  };

  // === Handle Input Change ===
  const handleEditChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  // === Loading & Error States ===
  if (localIsLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (localError) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>Warning</div>
          <h2>Error</h2>
          <p>{localError}</p>
        </div>
      </div>
    );
  }

  if (!resumeData?.githubUsername) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorCard}>
          <p>No resume data available. Please go back and fill out the form.</p>
          <button onClick={() => navigate('/input')} style={styles.goBackButton}>
            Go back to form
          </button>
        </div>
      </div>
    );
  }

  // === Render ===
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.headerCard}>
          <div style={styles.headerTop}>
            <div style={styles.headerLeft}>
              {isEditing.githubUsername ? (
                <div style={styles.editingRow}>
                  <input
                    style={styles.nameInput}
                    value={editValues.githubUsername || ''}
                    onChange={(e) => handleEditChange('githubUsername', e.target.value)}
                  />
                  <button style={styles.saveButton} onClick={() => saveEdit('githubUsername')}>
                    Save
                  </button>
                </div>
              ) : (
                <div style={styles.nameRow}>
                  <h1 style={styles.name}>{resumeData.githubUsername}</h1>
                  <button style={styles.editButtonSmall} onClick={() => startEditing('githubUsername')}>
                    Edit
                  </button>
                </div>
              )}
              <p style={styles.headline}>Software Developer</p>
            </div>
            <button
              onClick={handlePDFGeneration}
              disabled={localIsLoading}
              style={{ ...styles.pdfButton, ...(localIsLoading ? styles.pdfButtonDisabled : {}) }}
            >
              {localIsLoading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>

          {/* Contact Info */}
          <div style={styles.contactGrid}>
            {['email', 'mobile', 'linkedin'].map((field) => (
              <div key={field} style={styles.contactItem}>
                <span style={styles.contactIcon}>
                  {field === 'email' ? 'Email' : field === 'mobile' ? 'Phone' : 'LinkedIn'}
                </span>
                {isEditing[`ContactInfo_${field}`] ? (
                  <div style={styles.contactEditRow}>
                    <input
                      style={styles.contactInput}
                      value={editValues[`ContactInfo_${field}`] || ''}
                      onChange={(e) => handleEditChange(`ContactInfo_${field}`, e.target.value)}
                    />
                    <button
                      style={styles.saveButtonSmall}
                      onClick={() => saveEdit('ContactInfo', null, `contactInfo.${field}`)}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div style={styles.contactViewRow}>
                    <span style={styles.contactValue}>
                      {resumeData.contactInfo?.[field] || 'N/A'}
                    </span>
                    <button
                      style={styles.editButtonTiny}
                      onClick={() => startEditing('ContactInfo', null, `contactInfo.${field}`)}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <Section title="Summary" icon="Summary" expanded={expandedSections.summary} onToggle={() => toggleSection('summary')}>
          {isEditing.Summary ? (
            <div style={styles.editContainer}>
              <textarea
                style={styles.textarea}
                value={editValues.Summary || ''}
                onChange={(e) => handleEditChange('Summary', e.target.value)}
                rows="4"
              />
              <button style={styles.saveButtonLarge} onClick={() => saveEdit('Summary')}>
                Save
              </button>
            </div>
          ) : (
            <div style={styles.viewRow}>
              <p style={styles.text}>{resumeData.summary || aiOverview || 'No summary'}</p>
              <button style={styles.editButtonSmall} onClick={() => startEditing('Summary')}>
                Edit
              </button>
            </div>
          )}
        </Section>

        <Section title="Skills" icon="Skills" expanded={expandedSections.skills} onToggle={() => toggleSection('skills')}>
          {isEditing.Skills ? (
            <div style={styles.editContainer}>
              <textarea
                style={styles.textarea}
                value={editValues.Skills || ''}
                onChange={(e) => handleEditChange('Skills', e.target.value)}
                rows="6"
                placeholder="e.g., Languages: JavaScript, Python; Frameworks: React, Django"
              />
              <button
                style={styles.saveButtonLarge}
                onClick={() => {
                  const value = editValues.Skills || '';
                  const categories = {};
                  value.split(';').forEach((line) => {
                    const [cat, ...skills] = line.split(':').map((s) => s.trim());
                    if (cat && skills.length) categories[cat] = skills.join(':').split(',').map((s) => s.trim());
                  });
                  const updated = { ...resumeData };
                  updated.categorizedSkills = Object.keys(categories).length ? categories : { Skills: value.split(',').map((s) => s.trim()) };
                  setResumeData(updated);
                  setIsEditing((prev) => ({ ...prev, Skills: false }));
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <div>
              {resumeData.categorizedSkills ? (
                Object.entries(resumeData.categorizedSkills).map(([cat, skills]) => (
                  <div key={cat} style={styles.skillRow}>
                    <span style={styles.skillCategory}>{cat}:</span>
                    <div style={styles.skillTags}>
                      {skills.map((s, i) => (
                        <span key={i} style={styles.skillTag}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.noData}>No skills</p>
              )}
              <button style={{ ...styles.editButtonSmall, marginTop: '12px' }} onClick={() => startEditing('Skills')}>
                Edit Skills
              </button>
            </div>
          )}
        </Section>

        <Section title="Projects" icon="Projects" expanded={expandedSections.projects} onToggle={() => toggleSection('projects')}>
          <button style={styles.addButton} onClick={() => addItem('Projects')}>Add Project</button>
          {resumeData.projects?.items?.length ? (
            resumeData.projects.items.map((p, i) => (
              <div key={i} style={styles.projectCard}>
                <div style={styles.projectHeader}>
                  <div style={styles.projectLeft}>
                    {isEditing[`Projects_${i}_name`] ? (
                      <div style={styles.editContainer}>
                        <input
                          style={styles.projectNameInput}
                          value={editValues[`Projects_${i}_name`] || p.name}
                          onChange={(e) => handleEditChange(`Projects_${i}_name`, e.target.value)}
                        />
                        <button
                          style={styles.saveButton}
                          onClick={() => saveEdit('Projects', i, 'name')}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div style={styles.projectNameContainer}>
                        <a href={p.html_url} style={styles.projectName} target="_blank" rel="noopener noreferrer">
                          {p.name}
                        </a>
                        <button
                          style={styles.editButton}
                          onClick={() => startEditing('Projects', i, 'name')}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {isEditing[`Projects_${i}_description`] ? (
                  <div style={styles.editContainer}>
                    <textarea
                      style={styles.textarea}
                      value={editValues[`Projects_${i}_description`] || p.description}
                      onChange={(e) => handleEditChange(`Projects_${i}_description`, e.target.value)}
                    />
                    <button
                      style={styles.saveButton}
                      onClick={() => saveEdit('Projects', i, 'description')}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div style={styles.descriptionContainer}>
                    <p style={styles.description}>{p.description || 'No description'}</p>
                    <button
                      style={styles.editButton}
                      onClick={() => startEditing('Projects', i, 'description')}
                    >
                      Edit
                    </button>
                  </div>
                )}
                <div style={styles.projectMeta}>
                  <span style={styles.metaItem}>Stars: {p.stars || 0}</span>
                  {p.technologies?.length > 0 && (
                    <div style={styles.technologies}>
                      {p.technologies.map((tech, techIndex) => (
                        <span key={techIndex} style={styles.tech}>{tech}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button style={styles.removeButton} onClick={() => removeItem('Projects', i)}>Remove</button>
              </div>
            ))
          ) : (
            <p style={styles.noData}>No projects</p>
          )}
        </Section>

        {/* Experience, Education, Certifications, Hobbies, Custom Sections... (same pattern) */}
        {/* Omitted for brevity — use same pattern as Projects/Summary */}
      </div>
    </div>
  );
};

// === Section Component ===
const Section = ({ title, icon, children, expanded, onToggle }) => (
  <div style={styles.section}>
    <button onClick={onToggle} style={styles.sectionHeader}>
      <div style={styles.sectionTitle}>
        <span style={styles.sectionIcon}>{icon}</span>
        <h2 style={styles.sectionTitleText}>{title}</h2>
      </div>
      <span style={styles.chevron}>{expanded ? 'Up' : 'Down'}</span>
    </button>
    {expanded && <div style={styles.sectionContent}>{children}</div>}
  </div>
);

// === Styles ===
const styles = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', padding: '32px 16px' },
  content: { maxWidth: '1200px', margin: '0 auto' },
  loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' },
  spinner: { width: 48, height: 48, border: '4px solid #e5e7eb', borderTop: '4px solid #9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 },
  errorCard: { background: 'white', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: 32, maxWidth: 400, textAlign: 'center' },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  goBackButton: { padding: '12px 24px', background: '#9333ea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' },
  projectCard: { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
  projectHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  projectLeft: { flex: 1 },
  projectName: { fontSize: '16px', fontWeight: 'bold', color: '#111827', textDecoration: 'none', marginRight: '12px' },
  projectMeta: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' },
  metaItem: { color: '#6b7280', fontSize: '14px' },
  removeButton: { marginTop: '12px', padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  editContainer: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' },
  projectNameInput: { padding: '8px', borderRadius: '4px', border: '1px solid #e5e7eb', width: '100%' },
  projectNameContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
  editButton: { padding: '4px 8px', background: '#9333ea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  saveButton: { padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', alignSelf: 'flex-end' },
  textarea: { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e5e7eb', minHeight: '100px', resize: 'vertical' },
  descriptionContainer: { display: 'flex', alignItems: 'flex-start', gap: '8px' },
  description: { margin: '0', flex: 1 },
  technologies: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' },
  tech: { padding: '2px 8px', background: '#f3f4f6', borderRadius: '12px', fontSize: '12px' },
  headerCard: { background: 'white', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: 32, marginBottom: 24 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  name: { fontSize: 36, fontWeight: 'bold', margin: 0, color: '#111827' },
  pdfButton: { padding: '12px 24px', background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 },
  pdfButtonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, paddingTop: 24, borderTop: '1px solid #e5e7eb' },
  section: { background: 'white', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: 24, overflow: 'hidden' },
  sectionHeader: { width: '100%', display: 'flex', justifyContent: 'space-between', padding: 24, background: 'transparent', border: 'none', cursor: 'pointer' },
  sectionTitleText: { fontSize: 24, fontWeight: 'bold', margin: 0, color: '#111827' },
  sectionContent: { padding: '0 24px 24px' },
  editContainer: { display: 'flex', flexDirection: 'column' },
  textarea: { width: '100%', padding: 12, border: '2px solid #9333ea', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  saveButtonLarge: { alignSelf: 'flex-end', marginTop: 8, padding: '10px 20px', background: '#9333ea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' },
  projectCard: { border: '2px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 },
  addButton: { padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 16 },
  noData: { color: '#9ca3af', fontStyle: 'italic' },
};

export default ResultsPage;