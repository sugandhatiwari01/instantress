import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import axios from 'axios';
import { PDFViewer } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import ResumePDF from './ResumePDF';
import 'react-quill/dist/quill.snow.css';
import './ResultsPage.css';

const ResultsPage = ({ data, error: initialError, isLoading: initialIsLoading, aiOverview, selectedTemplate }) => {
  const navigate = useNavigate();
  
  // Handle data availability and loading states
  React.useEffect(() => {
    console.log('ResultsPage received data:', data);
    console.log('ResultsPage received aiOverview:', aiOverview);
    console.log('ResultsPage received template:', selectedTemplate);
    
    if (!data) {
      if (!initialIsLoading) {
        console.log('No data available and not loading');
        setLocalError('No data available');
      } else {
        console.log('Still loading data...');
        setLocalError('');
      }
      return;
    }

    if (typeof data !== 'object') {
      console.error('Invalid data format received:', data);
      setLocalError('Invalid data format received');
      return;
    }

    console.log('Initializing resume data with:', data);
    // Initialize the resume data
    setResumeData(data);
    setLocalError(''); // Clear any previous errors
    
    // Expand all sections by default
    setExpandedSections({
      summary: true,
      skills: true,
      projects: true,
      experience: true,
      education: true,
      certifications: true,
      hobbies: true
    });
  }, [data, initialIsLoading, aiOverview, selectedTemplate]);

  const [activeTab, setActiveTab] = useState('resume');
  const [localError, setLocalError] = useState(initialError || '');
  const [localIsLoading, setLocalIsLoading] = useState(initialIsLoading || false);
  const [portfolioCode, setPortfolioCode] = useState('');
  const editorRef = useRef(null);

  // Editor state
  const [resumeData, setResumeData] = useState(data || {});

  // Update resumeData when data prop changes
  React.useEffect(() => {
    console.log('Updating resumeData with:', data);
    if (data) {
      setResumeData(data);
    }
  }, [data]);

  const [isEditing, setIsEditing] = useState({});
  const [editValues, setEditValues] = useState({});
  const [expandedSections, setExpandedSections] = useState({

    
    summary: true,
    skills: true,
    projects: true,
    experience: true,
    education: true,
    certifications: true,
    hobbies: true
  });

  // Format custom section content
  const formatCustomSection = (section) => {
    if (!section) return 'No content';
    if (typeof section === 'string') return section;
    if (section.content) return section.content;
    if (section.items && Array.isArray(section.items)) {
      return section.items.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n');
    }
    return 'No content';
  };

  // Format education for display
  const formatEducation = (edu) => {
    if (typeof edu === 'string') return edu;
    if (edu && typeof edu === 'object') {
      if (edu.content) return edu.content;
      if (edu.degree && edu.institution) {
        return `${edu.degree}, ${edu.institution}${edu.dates ? ` (${edu.dates})` : ''}${edu.gpa ? `; GPA: ${edu.gpa}` : ''}`;
      }
    }
    return 'No education details';
  };

  // Format hobbies for display
  const formatHobbies = (hobbies) => {
    if (hobbies && typeof hobbies === 'object') {
      if (hobbies.content) return hobbies.content;
      if (hobbies.items && Array.isArray(hobbies.items)) return hobbies.items.join(', ');
    }
    return 'No hobbies listed';
  };

  // Generate portfolio website code
  const handleGeneratePortfolio = async () => {
    try {
      setLocalIsLoading(true);
      const response = await axios.post('http://localhost:5000/api/generate-portfolio', {
        resumeData: {
          ...resumeData,
          github: data?.githubData,
          leetcode: data?.leetcodeData,
          linkedin: data?.linkedinInfo
        }
      });
      setPortfolioCode(response.data.data.portfolioCode);
      setActiveTab('portfolio');
    } catch (error) {
      setLocalError('Error generating portfolio: ' + error.message);
    } finally {
      setLocalIsLoading(false);
    }
  };

  // Download resume as PDF
  const handleDownloadPDF = async () => {
    try {
      console.log('Starting PDF generation with data:', resumeData);
      setLocalIsLoading(true);

      // First get the formatted data from the backend
      console.log('Requesting PDF data from server...');
      const pdfDataResponse = await axios.post('http://localhost:4000/api/export-pdf', {
        githubUsername: resumeData.githubUsername,
        name: resumeData.name || resumeData.githubUsername,
        contactInfo: resumeData.contactInfo || {},
        summary: resumeData.summary,
        skills: resumeData.skills || { items: [] },
        projects: resumeData.projects || { items: [] },
        experience: resumeData.experience || { items: [] },
        education: resumeData.education,
        certifications: resumeData.certifications || { items: [] },
        template: resumeData.template || 'ATS-friendly'
      });
      console.log('Received PDF data from server:', pdfDataResponse.data);
      
      const pdfData = pdfDataResponse.data;

      // Create the PDF blob using the client-side component
      console.log('Generating PDF with data:', pdfData);
      const blob = await pdf(<ResumePDF data={pdfData} />).toBlob();
      
      // Download the PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = resumeData.githubUsername ? `${resumeData.githubUsername}_resume.pdf` : 'resume.pdf';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log('PDF generated and download initiated');
    } catch (error) {
      console.error('PDF generation error:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      setLocalError(`Error generating PDF: ${error.response?.data?.error || error.message}. Please try again.`);
    } finally {
      setLocalIsLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Start editing a section or item field
  const startEditing = (section, index = null, field = null) => {
    const key = index !== null ? `${section}_${index}_${field}` : section;
    setIsEditing({ ...isEditing, [key]: true });
    if (index !== null) {
      setEditValues({ ...editValues, [key]: resumeData[section.toLowerCase()]?.items[index]?.[field] || '' });
    } else {
      setEditValues({
        ...editValues,
        [section]: section === 'Skills' || section === 'Certifications'
          ? (resumeData[section.toLowerCase()]?.items || []).join(', ')
          : section === 'Education'
            ? formatEducation(resumeData.education)
            : section === 'Hobbies'
              ? formatHobbies(resumeData.hobbies)
              : resumeData.customSections?.[section]
                ? formatCustomSection(resumeData.customSections[section])
                : resumeData[section.toLowerCase()]?.content || resumeData[section.toLowerCase()]?.items?.join(', ') || ''
      });
    }
  };

  // Save edited content
  const saveEdit = (section, index = null, field = null) => {
    const key = index !== null ? `${section}_${index}_${field}` : section;
    const value = editValues[key];
    let updatedData = { ...resumeData };

    if (index !== null) {
      const items = [...(updatedData[section.toLowerCase()]?.items || [])];
      items[index] = { ...items[index], [field]: field === 'stargazers_count' ? parseInt(value) || 0 : value };
      updatedData[section.toLowerCase()] = { items };
    } else if (section === 'Skills' || section === 'Certifications') {
      const items = value.split(',').map(item => item.trim()).filter(item => item);
      updatedData[section.toLowerCase()] = { items };
    } else if (section === 'ContactInfo') {
      const [contactField] = field.split('.').slice(-1);
      updatedData.contactInfo = { ...updatedData.contactInfo, [contactField]: value };
    } else if (section === 'Education') {
      updatedData.education = value;
    } else if (section === 'Hobbies') {
      updatedData.hobbies = { content: value };
    } else if (section === 'Summary') {
      updatedData.summary = value;
    } else {
      updatedData.customSections = {
        ...updatedData.customSections,
        [section]: { content: value }
      };
    }

    setResumeData(updatedData);
    setIsEditing({ ...isEditing, [key]: false });
  };

  // Add new item to Projects or Experience
  const addItem = (section) => {
    const sectionKey = section === 'Projects' ? 'bestProjects' : section === 'Experience' ? 'workExperience' : section.toLowerCase();
    const newItem = section === 'Projects'
      ? { name: 'New Project', html_url: '', description: 'Project description', language: 'JavaScript', stargazers_count: 0, created_at: new Date().toISOString().split('T')[0], pushed_at: new Date().toISOString().split('T')[0] }
      : { title: 'Job Title', company: 'Company Name', dates: '2024 - Present', description: 'Job description' };
    
    const updatedData = { ...resumeData };
    if (!updatedData[sectionKey]) {
      updatedData[sectionKey] = { items: [] };
    }
    updatedData[sectionKey] = {
      ...updatedData[sectionKey],
      items: [...(updatedData[sectionKey]?.items || []), newItem]
    };
    setResumeData(updatedData);
  };

  // Remove item from Projects or Experience
  const removeItem = (section, index) => {
    const sectionKey = section === 'Projects' ? 'bestProjects' : section === 'Experience' ? 'workExperience' : section.toLowerCase();
    const updatedData = { ...resumeData };
    const items = [...(updatedData[sectionKey]?.items || [])];
    items.splice(index, 1);
    updatedData[sectionKey] = { ...updatedData[sectionKey], items };
    setResumeData(updatedData);
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    setLocalIsLoading(true);
    setLocalError('');
    try {
      const response = await axios.post('http://localhost:4000/api/export-pdf', {
        ...resumeData,
        template: selectedTemplate
      }, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resumeData.githubUser || 'resume'}_resume.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLocalIsLoading(false);
    } catch (err) {
      setLocalError('Failed to generate PDF');
      setLocalIsLoading(false);
    }
  };

  // Handle input changes for editing
  const handleEditChange = (key, value) => {
    setEditValues({ ...editValues, [key]: value });
  };

  if (localIsLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading...</p>
        </div>
      </div>
    );
  }

  if (localError) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>Error</h2>
          <p style={styles.errorText}>{localError}</p>
        </div>
      </div>
    );
  }

  if (!resumeData || !resumeData.githubUsername) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.errorCard}>
          <p style={styles.noDataText}>No resume data available. Please go back and fill out the form.</p>
          <button onClick={() => navigate('/input')} style={styles.goBackButton}>
            Go back to form
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering resume with data:', resumeData);
  
  if (localError) {
    return (
      <div style={styles.container}>
        <div style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#ffebee',
          border: '1px solid #ef5350',
          borderRadius: '4px',
          color: '#c62828'
        }}>
          <h3>Error</h3>
          <p>{localError}</p>
        </div>
      </div>
    );
  }

  if (localIsLoading) {
    return (
      <div style={styles.container}>
        <div style={{
          padding: '20px',
          margin: '20px',
          textAlign: 'center'
        }}>
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header Card */}
        <div style={styles.headerCard}>
          <div style={styles.headerTop}>
            <div style={styles.headerLeft}>
              {isEditing.githubUsername ? (
                <div style={styles.editingRow}>
                  <input
                    style={styles.nameInput}
                    value={editValues.githubUsername || resumeData.githubUsername || ''}
                    onChange={(e) => handleEditChange('githubUsername', e.target.value)}
                  />
                  <button
                    style={styles.saveButton}
                    onClick={() => saveEdit('githubUsername')}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div style={styles.nameRow}>
                  <h1 style={styles.name}>{resumeData.githubUsername || 'Your Name'}</h1>
                  <button
                    style={styles.editButtonSmall}
                    onClick={() => startEditing('githubUsername')}
                  >
                    ✎
                  </button>
                </div>
              )}
              <p style={styles.headline}>Software Developer</p>
            </div>
            
            <button
              onClick={handleGeneratePDF}
              disabled={localIsLoading}
              style={{...styles.pdfButton, ...(localIsLoading ? styles.pdfButtonDisabled : {})}}
            >
              {localIsLoading ? '⏳ Generating...' : '⬇ Generate PDF'}
            </button>
          </div>

          {/* Contact Info */}
          <div style={styles.contactGrid}>
            {['email', 'mobile', 'linkedin'].map(field => (
              <div key={field} style={styles.contactItem}>
                <span style={styles.contactIcon}>
                  {field === 'email' && '✉'}
                  {field === 'mobile' && '📱'}
                  {field === 'linkedin' && '🔗'}
                </span>
                {isEditing[`ContactInfo_${field}`] ? (
                  <div style={styles.contactEditRow}>
                    <input
                      style={styles.contactInput}
                      value={editValues[`ContactInfo_${field}`] || ''}
                      onChange={(e) => handleEditChange(`ContactInfo_${field}`, e.target.value)}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    />
                    <button
                      style={styles.saveButtonSmall}
                      onClick={() => saveEdit('ContactInfo', null, `contactInfo.${field}`)}
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div style={styles.contactViewRow}>
                    <span style={styles.contactValue}>
                      {field === 'email' && resumeData.contactInfo?.[field] ? (
                        <a href={`mailto:${resumeData.contactInfo[field]}`} style={styles.link}>
                          {resumeData.contactInfo[field]}
                        </a>
                      ) : field === 'mobile' && resumeData.contactInfo?.[field] ? (
                        <a href={`tel:${resumeData.contactInfo[field]}`} style={styles.link}>
                          {resumeData.contactInfo[field]}
                        </a>
                      ) : field === 'linkedin' && resumeData.contactInfo?.[field] ? (
                        <a href={resumeData.contactInfo[field]} target="_blank" rel="noopener noreferrer" style={styles.link}>
                          LinkedIn Profile
                        </a>
                      ) : (
                        resumeData.contactInfo?.[field] || 'N/A'
                      )}
                    </span>
                    <button
                      style={styles.editButtonTiny}
                      onClick={() => startEditing('ContactInfo', null, `contactInfo.${field}`)}
                    >
                      ✎
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Section */}
        <Section 
          title="Summary" 
          icon="📝" 
          expanded={expandedSections.summary} 
          onToggle={() => toggleSection('summary')}
        >
          {isEditing.Summary ? (
            <div style={styles.editContainer}>
              <textarea
                style={styles.textarea}
                value={editValues.Summary || ''}
                onChange={(e) => handleEditChange('Summary', e.target.value)}
                rows="4"
              />
              <button
                style={styles.saveButtonLarge}
                onClick={() => saveEdit('Summary')}
              >
                Save
              </button>
            </div>
          ) : (
            <div style={styles.viewRow}>
              <p style={styles.text}>{resumeData.summary || aiOverview || 'No summary available'}</p>
              <button
                style={styles.editButtonSmall}
                onClick={() => startEditing('Summary')}
              >
                ✎
              </button>
            </div>
          )}
        </Section>

        {/* Skills Section */}
        <Section 
          title="Skills" 
          icon="⚡" 
          expanded={expandedSections.skills} 
          onToggle={() => toggleSection('skills')}
        >
          {isEditing.Skills ? (
            <div style={styles.editContainer}>
              <textarea
                style={styles.textarea}
                value={editValues.Skills || ''}
                onChange={(e) => handleEditChange('Skills', e.target.value)}
                rows="6"
                placeholder="Enter skills as: Category1: skill1, skill2; Category2: skill3, skill4"
              />
              <button
                style={styles.saveButtonLarge}
                onClick={() => {
                  // Parse the skills input and update categorizedSkills
                  const value = editValues.Skills || '';
                  const updatedData = { ...resumeData };
                  
                  // Try to parse as categories
                  const categories = {};
                  const lines = value.split(';').map(l => l.trim()).filter(l => l);
                  
                  lines.forEach(line => {
                    const parts = line.split(':');
                    if (parts.length === 2) {
                      const category = parts[0].trim();
                      const skills = parts[1].split(',').map(s => s.trim()).filter(s => s);
                      categories[category] = skills;
                    }
                  });
                  
                  if (Object.keys(categories).length > 0) {
                    updatedData.categorizedSkills = categories;
                  } else {
                    // Fallback: treat as comma-separated list
                    const skills = value.split(',').map(s => s.trim()).filter(s => s);
                    updatedData.categorizedSkills = { 'Skills': skills };
                  }
                  
                  setResumeData(updatedData);
                  setIsEditing({ ...isEditing, Skills: false });
                }}
              >
                Save
              </button>
            </div>
          ) : (
            <div>
              <div style={styles.skillsContainer}>
                {resumeData.categorizedSkills ? (
                  Object.entries(resumeData.categorizedSkills).map(([category, items]) => (
                    <div key={category} style={styles.skillRow}>
                      <span style={styles.skillCategory}>{category}:</span>
                      <div style={styles.skillTags}>
                        {items.length ? items.map((skill, idx) => (
                          <span key={idx} style={styles.skillTag}>
                            {skill}
                          </span>
                        )) : <span style={styles.noData}>None</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={styles.noData}>No skills available</p>
                )}
              </div>
              <button
                style={{...styles.editButtonSmall, marginTop: '12px'}}
                onClick={() => {
                  // Convert categorizedSkills to editable format
                  const skillsText = resumeData.categorizedSkills 
                    ? Object.entries(resumeData.categorizedSkills)
                        .map(([cat, items]) => `${cat}: ${items.join(', ')}`)
                        .join('; ')
                    : '';
                  setEditValues({ ...editValues, Skills: skillsText });
                  setIsEditing({ ...isEditing, Skills: true });
                }}
              >
                ✎ Edit Skills
              </button>
            </div>
          )}
        </Section>

        {/* Projects Section */}
        <Section 
          title="Projects" 
          icon="🚀" 
          expanded={expandedSections.projects} 
          onToggle={() => toggleSection('projects')}
        >
          <button
            style={styles.addButton}
            onClick={() => addItem('Projects')}
          >
            ➕ Add Project
          </button>
          {resumeData.bestProjects?.items?.length ? (
            <div style={styles.itemsContainer}>
              {resumeData.bestProjects.items.map((project, index) => (
                <div key={index} style={styles.projectCard}>
                  <div style={styles.projectHeader}>
                    <div style={styles.projectLeft}>
                      <div style={styles.projectTitleRow}>
                        {isEditing[`Projects_${index}_name`] ? (
                          <>
                            <input
                              style={styles.projectNameInput}
                              value={editValues[`Projects_${index}_name`] || ''}
                              onChange={(e) => handleEditChange(`Projects_${index}_name`, e.target.value)}
                            />
                            <button
                              style={styles.saveButtonSmall}
                              onClick={() => saveEdit('Projects', index, 'name')}
                            >
                              ✓
                            </button>
                          </>
                        ) : (
                          <>
                            <a href={project.html_url} style={styles.projectName}>{project.name || 'Project Name'}</a>
                            <button
                              style={styles.editButtonTiny}
                              onClick={() => startEditing('Projects', index, 'name')}
                            >
                              ✎
                            </button>
                          </>
                        )}
                      </div>
                      <div style={styles.projectMeta}>
                        <span style={styles.stars}>⭐ {project.stargazers_count || 0}</span>
                        <span style={styles.language}>{project.language || 'N/A'}</span>
                      </div>
                      {isEditing[`Projects_${index}_description`] ? (
                        <div style={styles.editContainer}>
                          <textarea
                            style={styles.textarea}
                            value={editValues[`Projects_${index}_description`] || ''}
                            onChange={(e) => handleEditChange(`Projects_${index}_description`, e.target.value)}
                            rows="3"
                          />
                          <button
                            style={styles.saveButtonLarge}
                            onClick={() => saveEdit('Projects', index, 'description')}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div style={styles.viewRow}>
                          <p style={styles.description}>{project.description || 'No description'}</p>
                          <button
                            style={styles.editButtonTiny}
                            onClick={() => startEditing('Projects', index, 'description')}
                          >
                            ✎
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      style={styles.removeButton}
                      onClick={() => removeItem('Projects', index)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.noData}>No projects available</p>
          )}
        </Section>

        {/* Experience Section */}
        <Section 
          title="Experience" 
          icon="💼" 
          expanded={expandedSections.experience} 
          onToggle={() => toggleSection('experience')}
        >
          <button
            style={styles.addButton}
            onClick={() => addItem('Experience')}
          >
            ➕ Add Experience
          </button>
          {resumeData.workExperience?.items?.length ? (
            <div style={styles.itemsContainer}>
              {resumeData.workExperience.items.map((exp, index) => (
                <div key={index} style={styles.projectCard}>
                  <div style={styles.projectHeader}>
                    <div style={styles.projectLeft}>
                      {isEditing[`Experience_${index}_title`] ? (
                        <div style={styles.editContainer}>
                          <input
                            style={styles.expTitleInput}
                            value={editValues[`Experience_${index}_title`] || ''}
                            onChange={(e) => handleEditChange(`Experience_${index}_title`, e.target.value)}
                          />
                          <button
                            style={styles.saveButtonLarge}
                            onClick={() => saveEdit('Experience', index, 'title')}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div style={styles.expTitleRow}>
                          <h3 style={styles.expTitle}>{exp.title || 'Title'}</h3>
                          <button
                            style={styles.editButtonTiny}
                            onClick={() => startEditing('Experience', index, 'title')}
                          >
                            ✎
                          </button>
                        </div>
                      )}
                      <div style={styles.expMeta}>
                        <span style={styles.company}>{exp.company || 'Company'}</span>
                        <span style={styles.separator}>•</span>
                        <span style={styles.dates}>{exp.dates || 'Dates'}</span>
                      </div>
                      {isEditing[`Experience_${index}_description`] ? (
                        <div style={styles.editContainer}>
                          <textarea
                            style={styles.textarea}
                            value={editValues[`Experience_${index}_description`] || ''}
                            onChange={(e) => handleEditChange(`Experience_${index}_description`, e.target.value)}
                            rows="3"
                          />
                          <button
                            style={styles.saveButtonLarge}
                            onClick={() => saveEdit('Experience', index, 'description')}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div style={styles.viewRow}>
                          <p style={styles.description}>{exp.description || 'No description'}</p>
                          <button
                            style={styles.editButtonTiny}
                            onClick={() => startEditing('Experience', index, 'description')}
                          >
                            ✎
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      style={styles.removeButton}
                      onClick={() => removeItem('Experience', index)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.noData}>No experience available</p>
          )}
        </Section>

        {/* Education Section */}
        <Section 
          title="Education" 
          icon="🎓" 
          expanded={expandedSections.education} 
          onToggle={() => toggleSection('education')}
        >
          {isEditing.Education ? (
            <div style={styles.editContainer}>
              <textarea
                style={styles.textarea}
                value={editValues.Education || ''}
                onChange={(e) => handleEditChange('Education', e.target.value)}
                rows="4"
              />
              <button
                style={styles.saveButtonLarge}
                onClick={() => saveEdit('Education')}
              >
                Save
              </button>
            </div>
          ) : (
            <div style={styles.viewRow}>
              <p style={styles.text}>{formatEducation(resumeData.education)}</p>
              <button
                style={styles.editButtonSmall}
                onClick={() => startEditing('Education')}
              >
                ✎
              </button>
            </div>
          )}
        </Section>

        {/* Certifications Section */}
        <Section 
          title="Certifications" 
          icon="📜" 
          expanded={expandedSections.certifications} 
          onToggle={() => toggleSection('certifications')}
        >
          <div style={styles.certList}>
            {resumeData.certifications?.items?.length ? (
              resumeData.certifications.items.map((cert, index) => (
                <div key={index} style={styles.certItem}>
                  <span style={styles.bullet}>●</span>
                  {cert}
                </div>
              ))
            ) : (
              <p style={styles.noData}>No certifications available</p>
            )}
          </div>
        </Section>

        {/* Hobbies Section */}
        <Section 
          title="Hobbies" 
          icon="🎨" 
          expanded={expandedSections.hobbies} 
          onToggle={() => toggleSection('hobbies')}
        >
          {isEditing.Hobbies ? (
            <div style={styles.editContainer}>
              <textarea
                style={styles.textarea}
                value={editValues.Hobbies || ''}
                onChange={(e) => handleEditChange('Hobbies', e.target.value)}
                rows="4"
              />
              <button
                style={styles.saveButtonLarge}
                onClick={() => saveEdit('Hobbies')}
              >
                Save
              </button>
            </div>
          ) : (
            <div style={styles.viewRow}>
              <p style={styles.text}>{formatHobbies(resumeData.hobbies)}</p>
              <button
                style={styles.editButtonSmall}
                onClick={() => startEditing('Hobbies')}
              >
                ✎
              </button>
            </div>
          )}
        </Section>

        {/* Custom Sections */}
        {resumeData.customSections && Object.entries(resumeData.customSections)
          .filter(([section]) => !['Summary', 'Skills', 'Projects', 'Experience', 'Education', 'Certifications', 'Hobbies'].includes(section))
          .map(([section, content]) => (
            <Section 
              key={section} 
              title={section} 
              icon="📄" 
              expanded={expandedSections[section]} 
              onToggle={() => toggleSection(section)}
            >
              {isEditing[section] ? (
                <div style={styles.editContainer}>
                  <textarea
                    style={styles.textarea}
                    value={editValues[section] || ''}
                    onChange={(e) => handleEditChange(section, e.target.value)}
                    rows="4"
                  />
                  <button
                    style={styles.saveButtonLarge}
                    onClick={() => saveEdit(section)}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div style={styles.viewRow}>
                  <p style={styles.text}>{formatCustomSection(content)}</p>
                  <button
                    style={styles.editButtonSmall}
                    onClick={() => startEditing(section)}
                  >
                    ✎
                  </button>
                </div>
              )}
            </Section>
          ))}
      </div>
    </div>
  );
};

const Section = ({ title, icon, children, expanded, onToggle }) => (
  <div style={styles.section}>
    <button
      onClick={onToggle}
      style={styles.sectionHeader}
    >
      <div style={styles.sectionTitle}>
        <span style={styles.sectionIcon}>{icon}</span>
        <h2 style={styles.sectionTitleText}>{title}</h2>
      </div>
      <span style={styles.chevron}>{expanded ? '▲' : '▼'}</span>
    </button>
    {expanded && <div style={styles.sectionContent}>{children}</div>}
  </div>
);

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    padding: '32px 16px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loadingContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  loadingContent: {
    textAlign: 'center',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #9333ea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: '18px',
  },
  errorCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    padding: '32px',
    maxWidth: '400px',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '8px',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: '24px',
  },
  noDataText: {
    color: '#6b7280',
    marginBottom: '24px',
  },
  goBackButton: {
    padding: '12px 24px',
    background: '#9333ea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  headerCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    padding: '32px',
    marginBottom: '24px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    flex: 1,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  name: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  headline: {
    fontSize: '18px',
    color: '#6b7280',
    marginTop: '8px',
  },
  pdfButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(147, 51, 234, 0.3)',
    transition: 'all 0.3s',
  },
  pdfButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  contactGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  contactIcon: {
    fontSize: '18px',
    color: '#9333ea',
  },
  contactEditRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  contactInput: {
    flex: 1,
    padding: '8px 12px',
    border: '2px solid #9333ea',
    borderRadius: '8px',
    fontSize: '14px',
  },
  contactViewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  contactValue: {
    flex: 1,
    color: '#374151',
  },
  link: {
    color: '#9333ea',
    textDecoration: 'none',
  },
  section: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  sectionHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sectionIcon: {
    fontSize: '24px',
  },
  sectionTitleText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  chevron: {
    fontSize: '20px',
    color: '#9ca3af',
  },
  sectionContent: {
    padding: '0 24px 24px',
  },
  editingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  nameInput: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#111827',
    border: '2px solid #9333ea',
    borderRadius: '12px',
    padding: '8px 12px',
    outline: 'none',
  },
  saveButton: {
    padding: '10px 16px',
    background: '#9333ea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'background 0.2s',
  },
  saveButtonSmall: {
    padding: '8px 12px',
    background: '#9333ea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    flexShrink: 0,
  },
  saveButtonLarge: {
    padding: '10px 20px',
    background: '#9333ea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    alignSelf: 'flex-end',
    marginTop: '8px',
  },
  editButtonSmall: {
    padding: '8px 12px',
    background: 'transparent',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  editButtonTiny: {
    padding: '4px 8px',
    background: 'transparent',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  viewRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  text: {
    flex: 1,
    color: '#374151',
    lineHeight: '1.6',
    margin: 0,
  },
  editContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #9333ea',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  skillsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  skillRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap',
  },
  skillCategory: {
    fontWeight: '600',
    color: '#7c3aed',
    minWidth: '140px',
    flexShrink: 0,
  },
  skillTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    flex: 1,
  },
  skillTag: {
    padding: '6px 12px',
    background: '#f3e8ff',
    color: '#7c3aed',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
  },
  noData: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '16px',
    transition: 'background 0.2s',
  },
  itemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  projectCard: {
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    transition: 'border-color 0.2s',
  },
  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
  },
  projectLeft: {
    flex: 1,
  },
  projectTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  projectName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#9333ea',
    textDecoration: 'none',
  },
  projectNameInput: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#9333ea',
    border: '2px solid #9333ea',
    borderRadius: '8px',
    padding: '6px 10px',
    flex: 1,
    outline: 'none',
  },
  projectMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    fontSize: '14px',
  },
  stars: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#6b7280',
  },
  language: {
    padding: '2px 8px',
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: '4px',
    fontSize: '12px',
  },
  description: {
    flex: 1,
    color: '#374151',
    lineHeight: '1.5',
    margin: 0,
  },
  removeButton: {
    padding: '8px 12px',
    background: 'transparent',
    color: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  sectionIcon: {
    fontSize: '24px',
    marginRight: '12px',
    color: '#9333ea',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
  },
  sectionContent: {
    padding: '16px',
  },
  chevron: {
    fontSize: '20px',
    color: '#9ca3af',
    transition: 'transform 0.2s',
  },
  expTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  expTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  expTitleInput: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    border: '2px solid #9333ea',
    borderRadius: '8px',
    padding: '6px 10px',
    width: '100%',
    outline: 'none',
  },
  expMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '14px',
  },
  company: {
    color: '#9333ea',
    fontWeight: '600',
  },
  separator: {
    color: '#9ca3af',
  },
  dates: {
    color: '#6b7280',
  },
  certList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  certItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374151',
  },
  bullet: {
    color: '#9333ea',
    fontSize: '10px',
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  button:hover {
    opacity: 0.9;
  }
  .section-header:hover {
    background: #f9fafb !important;
  }
  .edit-button-small:hover {
    color: #9333ea !important;
    background: #f3e8ff !important;
  }
  .edit-button-tiny:hover {
    color: #9333ea !important;
    background: #f3e8ff !important;
  }
  .add-button:hover {
    background: #059669 !important;
  }
  .remove-button:hover {
    background: #fee2e2 !important;
  }
  .project-card:hover {
    border-color: #c4b5fd !important;
  }
`;
document.head.appendChild(styleSheet);

export default ResultsPage;