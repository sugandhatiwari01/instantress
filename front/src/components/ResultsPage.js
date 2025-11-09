import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumePDF from './ResumePDF';
import { handleDownloadAndOpenPDF } from './handleDownloadAndOpenPDF';
import 'react-quill/dist/quill.snow.css';
import './ResultsPage.css';
import { useAuth } from '../context/AuthContext';

/* --------------------------------------------------------------- */
/*                         STYLE DEFINITIONS                        */
/* --------------------------------------------------------------- */
const styles = {

portfolioContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    padding: 20,
  },
  portfolioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  portfolioTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  portfolioActions: {
    display: 'flex',
    gap: 10,
  },
  actionButton: {
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: '0.9rem',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
  },
  previewWrapper: {
    display: 'flex',
    flexDirection: 'column', // stack vertically
    gap: 20,
  },
  codePreview: {
    backgroundColor: '#1e1e1e',
    color: '#f8f8f2',
    borderRadius: 8,
    padding: 16,
    overflowX: 'auto',
    maxHeight: '60vh',
  },
  livePreview: {
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  code: {
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  iframe: {
    width: '100%',
    height: '70vh',
    border: 'none',
    borderRadius: 8,
  },
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', padding: '32px 16px' },
  content: { maxWidth: '1200px', margin: '0 auto' },

  tabContainer: { display: 'flex', gap: '16px', marginBottom: '24px' },
  tabButton: {
    padding: '12px 24px',
    background: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#000',
    transition: 'all .2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,.1)',
  },
  activeTab: { background: '#4a90e2', color: 'white', boxShadow: '0 2px 4px rgba(74,144,226,.3)' },

  headerCard: { background: 'white', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,.1)', padding: 32, marginBottom: 24 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  name: { fontSize: 36, fontWeight: 'bold', margin: 0, color: '#111827' },
  headline: { margin: '8px 0 0', color: '#6b7280' },
  buttonGroup: { display: 'flex', gap: 12, alignItems: 'center' },
  generatePortfolioButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  pdfButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 600,
  },
  pdfButtonDisabled: { opacity: 0.5, cursor: 'not-allowed' },

  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))', gap: 16, paddingTop: 24, borderTop: '1px solid #e5e7eb' },
  contactItem: { display: 'flex', alignItems: 'center', gap: 8 },
  contactIcon: { fontSize: 20 },
  contactValue: { flex: 1, color: '#111827' },

  section: { background: 'white', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,.1)', marginBottom: 24, overflow: 'hidden' },
  sectionHeader: { width: '100%', display: 'flex', justifyContent: 'space-between', padding: 24, background: 'transparent', border: 'none', cursor: 'pointer' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 12 },
  sectionIcon: { fontSize: 24 },
  sectionTitleText: { fontSize: 24, fontWeight: 'bold', margin: 0, color: '#111827' },
  sectionContent: { padding: '0 24px 24px' },

  editContainer: { display: 'flex', flexDirection: 'column', gap: 8 },
  textarea: { width: '100%', padding: 12, border: '2px solid #9333ea', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  nameInput: { fontSize: 36, fontWeight: 'bold', padding: '4px 8px', border: '2px solid #9333ea', borderRadius: 8 },
  saveButtonLarge: { alignSelf: 'flex-end', marginTop: 8, padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' },
  editButtonSmall: { padding: '4px 8px', background: '#9333ea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },
  saveButton: { padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },

  projectCard: { border: '2px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 },
  projectHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  projectName: { fontSize: 18, fontWeight: 600, color: '#000', textDecoration: 'none' },
  projectMeta: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, paddingTop: 8, borderTop: '1px solid #e5e7eb' },
  tech: { padding: '2px 8px', background: '#f3f4f6', borderRadius: 12, fontSize: 12 },
  addButton: { padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginBottom: 16 },
  removeButton: { marginTop: 12, padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 },

  portfolioContainer: { background: 'white', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,.1)', padding: 24, marginBottom: 24 },
  portfolioHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  portfolioTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', margin: 0 },
  portfolioActions: { display: 'flex', gap: 12 },
  actionButton: { padding: '8px 16px', background: '#9333ea', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  codePreview: { background: '#1e1e1e', borderRadius: 8, padding: 16, overflow: 'auto', maxHeight: 600 },
  code: { margin: 0, color: '#fff', fontFamily: 'monospace', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },

  loadingContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' },
  spinner: { width: 48, height: 48, border: '4px solid #e5e7eb', borderTop: '4px solid #9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 },
  errorCard: { background: 'white', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,.1)', padding: 32, maxWidth: 400, textAlign: 'center' },
  goBackButton: { padding: '12px 24px', background: '#9333ea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' },
};

/* --------------------------------------------------------------- */
/*                         SECTION COMPONENT                        */
/* --------------------------------------------------------------- */
const Section = ({ title, icon, expanded, onToggle, children }) => (
  <div style={styles.section}>
    <button onClick={onToggle} style={styles.sectionHeader}>
      <div style={styles.sectionTitle}>
        <span style={styles.sectionIcon}>{icon}</span>
        <h2 style={styles.sectionTitleText}>{title}</h2>
      </div>
      <span>{expanded ? 'Up' : 'Down'}</span>
    </button>
    {expanded && <div style={styles.sectionContent}>{children}</div>}
  </div>
);

/* --------------------------------------------------------------- */
/*                         MAIN COMPONENT                           */
/* --------------------------------------------------------------- */
const ResultsPage = ({
  data,
  error: initialError = '',
  isLoading: initialIsLoading = false,
  aiOverview = '',
  selectedTemplate,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();                     // <-- inside component
const [hasInitialized, setHasInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');
  const [portfolioCode, setPortfolioCode] = useState('');
  const [resumeData, setResumeData] = useState({});
  const [isEditing, setIsEditing] = useState({});
  const [editValues, setEditValues] = useState({});
  const [localError, setLocalError] = useState(initialError);
  const [localIsLoading, setLocalIsLoading] = useState(initialIsLoading);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    skills: true,
    projects: true,
    experience: true,
    education: true,
    certifications: true,
    hobbies: true,
  });

  /* ---------- Auto-fill from LinkedIn (once) ---------- */
// 1. Backend gave us full resume data → use it
useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const normalized = {
        ...data,
        githubUsername: data.name || data.linkedInProfile?.fullName || data.githubUsername || 'Your Name',
        profilePictureUrl: data.linkedInProfile?.pictureUrl || null,
        headline: data.linkedInProfile?.headline || 'Software Developer',
        contactInfo: {
          email: data.linkedInProfile?.email || data.contactInfo?.email || '',
          mobile: data.contactInfo?.mobile || '',
          linkedin: data.contactInfo?.linkedin || '',
        },
        projects: {
          title: 'Projects',
          items: (data.bestProjects || []).map(p => ({
            name: p.name || '',
            html_url: p.url || p.html_url || '',
            description: p.description || '',
            technologies: p.technologies || [],
            stars: p.stars || p.stargazers_count || 0,
            isEditable: true,
          })),
        },
        experience: data.workExperience && Array.isArray(data.workExperience)
          ? { title: 'Experience', items: data.workExperience }
          : { title: 'Experience', items: [] },
      };
      setResumeData(normalized);
      setLocalError('');
      return;
    }

    // 2. No backend data → initialise from LinkedIn user (if logged in)
    if (user && Object.keys(resumeData).length === 0) {
      const linkedInInit = {
        githubUsername:
          user.fullName ||
          user.name ||
          `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
          'Your Name',
        profilePictureUrl: user.pictureUrl || user.picture || null,
        headline: user.headline || 'Software Developer',
        contactInfo: {
          email: user.email || '',
          linkedin: user.profileUrl || '',
          mobile: '',
        },
        summary: '',
        categorizedSkills: {},
        projects: { title: 'Projects', items: [] },
        experience: { title: 'Experience', items: [] },
      };
      setResumeData(linkedInInit);
    }
  }, [data, user]);

  /* ---------- OPTIONAL: fetch LinkedIn experience (keep if you need it) ---------- */
 useEffect(() => {
  if (hasInitialized) return;

  if (data && Object.keys(data).length > 0) {
    const normalized = {
      ...data,
      githubUsername:
        data.linkedInProfile?.fullName ||
        user?.fullName ||
        data.name ||
        data.githubUsername ||
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
        'Your Name',
      profilePictureUrl: data.linkedInProfile?.pictureUrl || null,
      headline: data.linkedInProfile?.headline || 'Software Developer',
      contactInfo: {
        email: data.linkedInProfile?.email || data.contactInfo?.email || '',
        mobile: data.contactInfo?.mobile || '',
        linkedin: data.contactInfo?.linkedin || '',
      },
      projects: {
        title: 'Projects',
        items: (data.bestProjects || []).map(p => ({
          name: p.name || '',
          html_url: p.url || p.html_url || '',
          description: p.description || '',
          technologies: p.technologies || [],
          stars: p.stars || p.stargazers_count || 0,
          isEditable: true,
        })),
      },
      experience: data.workExperience && Array.isArray(data.workExperience)
        ? { title: 'Experience', items: data.workExperience }
        : { title: 'Experience', items: [] },
    };
    setResumeData(normalized);
    setLocalError('');
  } else if (user) {
    const linkedInInit = {
      githubUsername:
        user.fullName ||
        user.name ||
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        'Your Name',
      profilePictureUrl: user.pictureUrl || user.picture || null,
      headline: user.headline || 'Software Developer',
      contactInfo: {
        email: user.email || '',
        linkedin: user.profileUrl || '',
        mobile: '',
      },
      summary: '',
      categorizedSkills: {},
      projects: { title: 'Projects', items: [] },
      experience: { title: 'Experience', items: [] },
    };
    setResumeData(linkedInInit);
  }

  setHasInitialized(true);
}, [data, user, hasInitialized]);
  /* ---------- Helpers (unchanged) ---------- */
  const toggleSection = sec => setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
const startEditing = (section, index, field) => {
  const key = index !== undefined
    ? `${section}_${index}_${field}`
    : `${section}${field ? `_${field}` : ''}`;

  setIsEditing(prev => ({ ...prev, [key]: true }));

  let value = '';
  if (index !== undefined) {
    value = resumeData[section.toLowerCase()]?.items?.[index]?.[field] || '';
  } else if (section === 'Summary') {
    value = resumeData.summary || aiOverview || '';
  } else if (section === 'Skills') {
    const skills = resumeData.categorizedSkills || {};
    value = Object.entries(skills)
      .map(([cat, list]) => `${cat}: ${list.join(', ')}`)
      .join('; ');
  } else if (section === 'ContactInfo' && field) {
    value = resumeData.contactInfo?.[field] || '';
  }

  setEditValues(prev => ({ ...prev, [key]: value }));
};

const saveEdit = (section, index, field) => {
  if (section === 'githubUsername') {
    setResumeData((prev) => ({
      ...prev,
      githubUsername: editValues.githubUsername || prev.githubUsername,
    }));
    setIsEditing((prev) => ({ ...prev, githubUsername: false }));
    return;
  }

  // For contact info fields
  if (section === 'ContactInfo' && field) {
    setResumeData((prev) => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: editValues[`ContactInfo_${field}`] || '',
      },
    }));
    setIsEditing((prev) => ({
      ...prev,
      [`ContactInfo_${field}`]: false,
    }));
    return;
  }

  // For other sections like Projects, Summary, etc.
  if (section === 'Summary') {
    setResumeData((prev) => ({
      ...prev,
      summary: editValues.Summary || prev.summary,
    }));
    setIsEditing((prev) => ({ ...prev, Summary: false }));
    return;
  }

if (section === 'Skills') {
  const raw = editValues.Skills || '';
  const categories = {};
  raw.split(';').forEach(line => {
    const [cat, ...rest] = line.split(':').map(s => s.trim());
    if (cat && rest.length) {
      categories[cat] = rest.join(':').split(',').map(s => s.trim());
    }
  });
  const final = Object.keys(categories).length
    ? categories
    : { Skills: raw.split(',').map(s => s.trim()) };

  setResumeData(prev => ({ ...prev, categorizedSkills: final }));
  setIsEditing(prev => ({ ...prev, Skills: false }));
  return;
}

  if (section === 'Projects' && index !== undefined && field) {
    setResumeData((prev) => {
      const newProjects = [...(prev.projects?.items || [])];
      newProjects[index] = {
        ...newProjects[index],
        [field]: editValues[`Projects_${index}_${field}`],
      };
      return { ...prev, projects: { ...prev.projects, items: newProjects } };
    });
    setIsEditing((prev) => ({
      ...prev,
      [`Projects_${index}_${field}`]: false,
    }));
    return;
  }
};


  const addItem = section => {
    const key = section === 'Projects' ? 'projects' : 'experience';
    const newItem = section === 'Projects'
      ? { name: 'New Project', html_url: '', description: 'Project description', language: 'JavaScript', stargazers_count: 0 }
      : { title: 'Job Title', company: 'Company Name', dates: '2024 - Present', description: 'Job description' };

    setResumeData(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { items: [] }), items: [...(prev[key]?.items || []), newItem] },
    }));
  };

  const removeItem = (section, index) => {
    const key = section === 'Projects' ? 'projects' : 'experience';
    setResumeData(prev => {
      const items = [...(prev[key]?.items || [])];
      items.splice(index, 1);
      return { ...prev, [key]: { ...prev[key], items } };
    });
  };

  const handleEditChange = (field, value) => {
  setEditValues((prev) => ({ ...prev, [field]: value }));
};


  /* ---------- Format Helpers ---------- */
  const formatEducation = edu => {
    if (typeof edu === 'string') return edu;
    if (edu?.degree && edu?.institution) {
      return `${edu.degree}, ${edu.institution}${edu.dates ? ` (${edu.dates})` : ''}${edu.gpa ? `; GPA: ${edu.gpa}` : ''}`;
    }
    return 'No education details';
  };

  const formatHobbies = hobbies => {
    if (hobbies?.content) return hobbies.content;
    if (Array.isArray(hobbies?.items)) return hobbies.items.join(', ');
    return 'No hobbies listed';
  };

  const formatCustomSection = section => {
    if (!section) return 'No content';
    if (typeof section === 'string') return section;
    if (section.content) return section.content;
    if (Array.isArray(section.items)) return section.items.join('\n');
    return 'No content';
  };

  /* ---------- PDF & Portfolio (unchanged) ---------- */
  const handlePDFGeneration = async () => {
    setLocalIsLoading(true);
    setLocalError('');
    try {
      const pdfDoc = <ResumePDF data={resumeData} selectedTemplate={selectedTemplate} aiOverview={aiOverview} />;
      await handleDownloadAndOpenPDF(pdfDoc);
    } catch (err) {
      setLocalError('Failed to generate PDF');
      console.error(err);
    } finally {
      setLocalIsLoading(false);
    }
  };

  const handleGeneratePortfolio = async () => {
    setLocalIsLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/generate-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: {
            ...resumeData,
            github: resumeData.githubData || data?.githubData,
            leetcode: resumeData.leetcodeData || data?.leetcodeData,
            linkedin: resumeData.linkedinInfo || data?.linkedinInfo,
            projects: { items: resumeData.projects?.items || resumeData.projects || [] },
            summary: resumeData.summary,
            skills: resumeData.categorizedSkills,
            experience: resumeData.experience?.items || [],
            education: resumeData.education,
            contactInfo: resumeData.contactInfo,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate portfolio');
      const result = await response.json();
      setPortfolioCode(result.portfolioCode);
      setActiveTab('portfolio');
      alert('Portfolio generated! View it in the Portfolio tab.');
    } catch (err) {
      setLocalError('Error generating portfolio: ' + err.message);
    } finally {
      setLocalIsLoading(false);
    }
  };

  /* ---------- Loading / Error States ---------- */
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>Warning</div>
          <h2>Error</h2>
          <p>{localError}</p>
          <button style={styles.goBackButton} onClick={() => navigate('/input')}>
            Back to Form
          </button>
        </div>
      </div>
    );
  }

  if (!resumeData?.githubUsername) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorCard}>
          <p>No resume data available. Please fill out the form again.</p>
          <button style={styles.goBackButton} onClick={() => navigate('/input')}>
            Back to Form
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Tabs ---------- */
  const renderTabs = () => (
    <div style={styles.tabContainer}>
      <button
        style={{ ...styles.tabButton, ...(activeTab === 'resume' ? styles.activeTab : {}) }}
        onClick={() => setActiveTab('resume')}
      >
        Resume
      </button>
      <button
        style={{ ...styles.tabButton, ...(activeTab === 'portfolio' ? styles.activeTab : {}) }}
        onClick={() => setActiveTab('portfolio')}
      >
        Portfolio
      </button>
    </div>
  );

  /* ---------- Portfolio Tab ---------- */
const renderPortfolioTab = () => (
  <div style={styles.portfolioContainer}>
    {/* Header Section */}
    <div style={styles.portfolioHeader}>
      <h2 style={styles.portfolioTitle}>Portfolio Preview</h2>
      <div style={styles.portfolioActions}>
        <button style={styles.actionButton} onClick={() => setActiveTab('resume')}>
          Back to Resume
        </button>

        <button
          style={styles.actionButton}
          onClick={() => {
            navigator.clipboard
              .writeText(portfolioCode)
              .then(() => alert('Code copied to clipboard!'))
              .catch(() => alert('Failed to copy code.'));
          }}
        >
          Copy Code
        </button>

        <button
          style={styles.actionButton}
          onClick={() => {
            const blob = new Blob([portfolioCode], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'portfolio.html';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download HTML
        </button>
      </div>
    </div>

    {/* Code and Live Preview stacked vertically */}
    <div style={styles.previewWrapper}>
      {/* Code Section */}
      <div style={styles.codePreview}>
        <h3 style={styles.sectionTitle}>Code</h3>
        <pre style={styles.code}>
          {portfolioCode || 'Click "Generate Portfolio" on the Resume tab to create the code.'}
        </pre>
      </div>

      {/* Live Visual Preview */}
      <div style={styles.livePreview}>
        <h3 style={styles.sectionTitle}>Live Preview</h3>
        {portfolioCode ? (
          <iframe
            title="Portfolio Preview"
            style={styles.iframe}
            srcDoc={portfolioCode}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <p style={{ color: '#888' }}>No portfolio generated yet.</p>
        )}
      </div>
    </div>
  </div>
);



  /* ---------- Resume Tab – WITH LINKEDIN PHOTO & HEADLINE ---------- */
  const renderResumeTab = () => (
    <>
      {/* Header */}
       <div style={styles.headerCard}>
      <div style={styles.headerTop}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Profile picture - now using resumeData */}
          {resumeData.profilePictureUrl ? (
            <img
src="http://localhost:4000/api/linkedin/avatar"   
                  alt="Profile"
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #9333ea',
              }}
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = 'none';
                console.error('Failed to load profile picture');
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                color: '#6b7280',
                fontWeight: 'bold'
              }}
            >
              {resumeData.githubUsername?.[0]?.toUpperCase() || '?'}
            </div>
          )}

          {/* Name + Headline */}
          <div>
            {isEditing.githubUsername ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  style={styles.nameInput}
                  value={editValues.githubUsername || ''}
                  onChange={e => handleEditChange('githubUsername', e.target.value)}
                />
                <button style={styles.saveButton} onClick={() => saveEdit('githubUsername')}>
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={styles.name}>{resumeData.githubUsername || 'Your Name'}</h1>
                <button style={styles.editButtonSmall} onClick={() => startEditing('githubUsername')}>
                  Edit
                </button>
              </div>
            )}
            <p style={styles.headline}>
              {resumeData.headline || 'Software Developer'}
            </p>
          </div>
        </div>
          {/* Action Buttons */}
          <div style={styles.buttonGroup}>
            <button
              onClick={handleGeneratePortfolio}
              style={styles.generatePortfolioButton}
              disabled={localIsLoading}
            >
              {localIsLoading ? 'Generating...' : 'Generate Portfolio'}
            </button>
            <button
              onClick={handlePDFGeneration}
              style={{ ...styles.pdfButton, ...(localIsLoading ? styles.pdfButtonDisabled : {}) }}
              disabled={localIsLoading}
            >
              {localIsLoading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div style={styles.contactGrid}>
          {['email', 'mobile', 'linkedin'].map(field => (
            <div key={field} style={styles.contactItem}>
              <span style={styles.contactIcon}>
                {field === 'email' ? 'Email' : field === 'mobile' ? 'Phone' : 'LinkedIn'}
              </span>
              {isEditing[`ContactInfo_${field}`] ? (
                <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                  <input
                    style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #9333ea' }}
                    value={editValues[`ContactInfo_${field}`] || ''}
                    onChange={e => handleEditChange(`ContactInfo_${field}`, e.target.value)}
                  />
                  <button
  style={styles.saveButton}
  onClick={() => saveEdit('ContactInfo', undefined, field)}
>
  Save
</button>

                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flex: 1, alignItems: 'center' }}>
                  <span style={styles.contactValue}>{resumeData.contactInfo?.[field] || 'N/A'}</span>
                  <button
  style={styles.editButtonSmall}
  onClick={() => startEditing('ContactInfo', undefined, field)}
>
  Edit
</button>

                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
    {/* Summary */}
<Section
  title="Summary"
  icon="Summary"
  expanded={expandedSections.summary}
  onToggle={() => toggleSection('summary')}
>
{isEditing.Summary ? (
  <div style={styles.editContainer}>
    <textarea
      style={styles.textarea}
      rows={4}
      value={editValues.Summary || ''}
      onChange={(e) => handleEditChange('Summary', e.target.value)}
    />
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button style={styles.saveButton} onClick={() => saveEdit('Summary')}>
        Save
      </button>
      <button
        style={{ ...styles.saveButton, background: '#6b7280' }}
        onClick={() => setIsEditing(prev => ({ ...prev, Summary: false }))}
      >
        Cancel
      </button>
    </div>
  </div>
) : (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <p style={{ margin: 0, textAlign: 'justify', lineHeight: '1.6' }}>
      {resumeData.summary || aiOverview || 'No summary'}
    </p>
    <button
      style={{ ...styles.editButtonSmall, alignSelf: 'flex-start' }}
      onClick={() => startEditing('Summary')}
    >
      Edit
    </button>
  </div>
)}
</Section>


      {/* Skills */}
      <Section title="Skills" icon="Skills" expanded={expandedSections.skills} onToggle={() => toggleSection('skills')}>
        {isEditing.Skills ? (
          <div style={styles.editContainer}>
            <textarea
              style={styles.textarea}
              rows={6}
              placeholder="Languages: JavaScript, Python; Frameworks: React, Django"
              value={editValues.Skills || ''}
              onChange={(e) => handleEditChange('Skills', e.target.value)}
            />
            <button
              style={styles.saveButtonLarge}
              onClick={() => {
                const raw = editValues.Skills || '';
                const categories = {};
                raw.split(';').forEach(line => {
                  const [cat, ...rest] = line.split(':').map(s => s.trim());
                  if (cat && rest.length) categories[cat] = rest.join(':').split(',').map(s => s.trim());
                });
                const final = Object.keys(categories).length ? categories : { Skills: raw.split(',').map(s => s.trim()) };
                setResumeData(prev => ({ ...prev, categorizedSkills: final }));
                setIsEditing(prev => ({ ...prev, Skills: false }));
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <div>
            {resumeData.categorizedSkills ? (
              Object.entries(resumeData.categorizedSkills).map(([cat, list]) => (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <strong>{cat}:</strong>{' '}
                  <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                    {list.map((skill, i) => (
                      <span key={i} style={styles.tech}>{skill}</span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontStyle: 'italic', color: '#6b7280' }}>No skills listed</p>
            )}
            <button style={styles.editButtonSmall} onClick={() => startEditing('Skills')}>
              Edit Skills
            </button>
          </div>
        )}
      </Section>

      {/* Projects */}
     <Section
  title="Projects"
  icon="Projects"
  expanded={expandedSections.projects}
  onToggle={() => toggleSection('projects')}
>
  <button style={styles.addButton} onClick={() => addItem('Projects')}>
    Add Project
  </button>

  {resumeData.projects?.items?.length ? (
    resumeData.projects.items.map((project, i) => (
      <div key={i} style={styles.projectCard}>
        {/* ---------------- Name ---------------- */}
        <div style={styles.projectHeader}>
          <div style={{ flex: 1 }}>
            {isEditing[`Projects_${i}_name`] ? (
              <div style={styles.editContainer}>
                <input
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid #9333ea',
                  }}
                  value={editValues[`Projects_${i}_name`] || project.name}
                  onChange={(e) =>
                    handleEditChange(`Projects_${i}_name`, e.target.value)
                  }
                />
                <button
                  style={styles.saveButton}
                  onClick={() => saveEdit('Projects', i, 'name')}
                >
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={project.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.projectName}
                >
                  {project.name}
                </a>
                <button
                  style={styles.editButtonSmall}
                  onClick={() => startEditing('Projects', i, 'name')}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- Description ---------------- */}
        {isEditing[`Projects_${i}_description`] ? (
          <div style={styles.editContainer}>
            <textarea
              style={styles.textarea}
              rows={3}
              value={
                editValues[`Projects_${i}_description`] || project.description
              }
              onChange={(e) =>
                handleEditChange(`Projects_${i}_description`, e.target.value)
              }
            />
            <button
              style={styles.saveButton}
              onClick={() => saveEdit('Projects', i, 'description')}
            >
              Save
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginTop: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                textAlign: 'justify',
                lineHeight: '1.6',
              }}
            >
              {project.description || 'No description'}
            </p>
            <button
              style={{
                ...styles.editButtonSmall,
                alignSelf: 'flex-start',
                marginTop: 5,
              }}
              onClick={() => startEditing('Projects', i, 'description')}
            >
              Edit
            </button>
          </div>
        )}

        {/* ---------------- Meta ---------------- */}
        <div style={styles.projectMeta}>
          <span>⭐ Stars: {project.stars || 0}</span>
          {project.technologies?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {project.technologies.map((tech, idx) => (
                <span key={idx} style={styles.tech}>
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          style={styles.removeButton}
          onClick={() => removeItem('Projects', i)}
        >
          Remove
        </button>
      </div>
    ))
  ) : (
    <p style={{ fontStyle: 'italic', color: '#6b7280' }}>No projects</p>
  )}
</Section>

<Section
  title="Experience"
  icon="Experience"
  expanded={expandedSections.experience}
  onToggle={() => toggleSection('experience')}
>
  <button style={styles.addButton} onClick={() => addItem('Experience')}>
    Add Experience
  </button>

  {resumeData.experience?.items?.length ? (
    resumeData.experience.items.map((exp, i) => (
      <div key={i} style={styles.projectCard}>
        <div style={styles.projectHeader}>
          <h3 style={{ margin: 0 }}>{exp.title} at {exp.company}</h3>
          <button
            style={styles.removeButton}
            onClick={() => removeItem('Experience', i)}
          >
            Remove
          </button>
        </div>
        <p style={{ margin: '4px 0', color: '#6b7280' }}>{exp.dates}</p>
        <p style={{ margin: '8px 0', textAlign: 'justify' }}>{exp.description}</p>
      </div>
    ))
  ) : (
    <p style={{ fontStyle: 'italic', color: '#6b7280' }}>No experience listed</p>
  )}
</Section>
      {/* Add more sections like Experience, Education, etc. using same pattern */}
    </>
  );

  /* ---------- Main Render ---------- */
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {renderTabs()}
        {activeTab === 'portfolio' ? renderPortfolioTab() : renderResumeTab()}
      </div>
    </div>
  );
};

export default ResultsPage;