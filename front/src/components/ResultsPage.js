import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { pdf } from '@react-pdf/renderer';
import ResumePDF from './ResumePDF';
import './ResultsPage.css';

const ResultsPage = ({ data, error: initialError, isLoading: initialIsLoading, aiOverview, selectedTemplate }) => {
  const navigate = useNavigate();

  // Initialize state
  const [resumeData, setResumeData] = useState(data || {});
  const [isEditing, setIsEditing] = useState({});
  const [editValues, setEditValues] = useState({});
  const [localError, setLocalError] = useState(initialError || '');
  const [localIsLoading, setLocalIsLoading] = useState(initialIsLoading || false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    skills: true,
    projects: true,
    experience: true,
    education: true,
    certifications: true,
    hobbies: true,
  });

  // Handle data updates
  useEffect(() => {
    console.log('Received data:', data);
    if (!data) {
      if (!initialIsLoading) {
        setLocalError('No data available');
      }
      return;
    }
    setResumeData(data);
    setLocalError('');
  }, [data, initialIsLoading]);

  // Toggle section visibility
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Start editing a field
  const startEditing = (section, index = null, field = null) => {
    const key = index !== null ? `${section}_${index}_${field}` : section;
    setIsEditing((prev) => ({ ...prev, [key]: true }));

    let value = '';
    if (section === 'githubUsername') {
      value = resumeData.githubUsername || '';
    } else if (section === 'ContactInfo') {
      value = resumeData.contactInfo?.[field] || '';
    } else if (section === 'Skills' || section === 'Certifications') {
      value = resumeData[section.toLowerCase()]?.items?.join(', ') || '';
    } else if (section === 'Education') {
      value = formatEducation(resumeData.education);
    } else if (section === 'Hobbies') {
      value = formatHobbies(resumeData.hobbies);
    } else if (section === 'Summary') {
      value = resumeData.summary || aiOverview || '';
    } else if (index !== null) {
      value = resumeData[section.toLowerCase()]?.items?.[index]?.[field] || '';
    } else {
      value = resumeData.customSections?.[section]?.content || '';
    }
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  // Save edited content
  const saveEdit = (section, index = null, field = null) => {
    const key = index !== null ? `${section}_${index}_${field}` : section;
    const value = editValues[key];
    let updatedData = { ...resumeData };

    if (section === 'githubUsername') {
      updatedData.githubUsername = value;
    } else if (section === 'ContactInfo') {
      updatedData.contactInfo = { ...updatedData.contactInfo, [field]: value };
    } else if (section === 'Skills' || section === 'Certifications') {
      updatedData[section.toLowerCase()] = { items: value.split(',').map((item) => item.trim()).filter((item) => item) };
    } else if (section === 'Education') {
      updatedData.education = { content: value };
    } else if (section === 'Hobbies') {
      updatedData.hobbies = { items: value.split(',').map((item) => item.trim()).filter((item) => item) };
    } else if (section === 'Summary') {
      updatedData.summary = value;
    } else if (index !== null) {
      const sectionKey = section.toLowerCase();
      const items = [...(updatedData[sectionKey]?.items || [])];
      items[index] = { ...items[index], [field]: value };
      updatedData[sectionKey] = { items };
    } else {
      updatedData.customSections = { ...updatedData.customSections, [section]: { content: value } };
    }

    setResumeData(updatedData);
    setIsEditing((prev) => ({ ...prev, [key]: false }));
  };

  // Handle input changes
  const handleEditChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  // Add new item to Projects or Experience
  const addItem = (section) => {
    const sectionKey = section.toLowerCase();
    const newItem = section === 'Projects'
      ? {
          name: 'New Project',
          html_url: '',
          description: 'Project description',
          language: 'JavaScript',
          stargazers_count: 0,
          created_at: new Date().toISOString().split('T')[0],
          pushed_at: new Date().toISOString().split('T')[0],
        }
      : {
          title: 'New Job Title',
          company: 'Company Name',
          dates: '2024 - Present',
          description: 'Job description',
        };

    setResumeData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        items: [...(prev[sectionKey]?.items || []), newItem],
      },
    }));
  };

  // Remove item from Projects or Experience
  const removeItem = (section, index) => {
    const sectionKey = section.toLowerCase();
    setResumeData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        items: prev[sectionKey]?.items?.filter((_, i) => i !== index) || [],
      },
    }));
  };

  // Format education for display
  const formatEducation = (edu) => {
    if (typeof edu === 'string') return edu;
    if (edu?.content) return edu.content;
    if (edu?.degree && edu?.institution) {
      return `${edu.degree}, ${edu.institution}${edu.dates ? ` (${edu.dates})` : ''}${edu.gpa ? `; GPA: ${edu.gpa}` : ''}`;
    }
    return 'No education details';
  };

  // Format hobbies for display
  const formatHobbies = (hobbies) => {
    if (hobbies?.content) return hobbies.content;
    if (hobbies?.items?.length) return hobbies.items.join(', ');
    return 'No hobbies listed';
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    setLocalIsLoading(true);
    setLocalError('');
    try {
      const pdfData = {
        githubUsername: resumeData.githubUsername,
        name: resumeData.name || resumeData.githubUsername,
        contactInfo: resumeData.contactInfo || {},
        summary: resumeData.summary,
        skills: resumeData.skills || { items: [] },
        projects: resumeData.projects || { items: [] },
        experience: resumeData.experience || { items: [] },
        education: resumeData.education,
        certifications: resumeData.certifications || { items: [] },
        template: selectedTemplate || 'ATS-friendly',
      };

      const blob = await pdf(<ResumePDF data={pdfData} />).toBlob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resumeData.githubUsername || 'resume'}_resume.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setLocalError(`Failed to generate PDF: ${err.message}`);
    } finally {
      setLocalIsLoading(false);
    }
  };

  // Loading and error states
  if (localIsLoading) {
    return <div style={styles.loadingContainer}>Loading...</div>;
  }

  if (localError) {
    return <div style={styles.errorContainer}>{localError}</div>;
  }

  if (!resumeData || !resumeData.githubUsername) {
    return (
      <div style={styles.errorContainer}>
        <p>No resume data available. Please go back and fill out the form.</p>
        <button onClick={() => navigate('/input')} style={styles.goBackButton}>
          Go back to form
        </button>
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
                    value={editValues.githubUsername || ''}
                    onChange={(e) => handleEditChange('githubUsername', e.target.value)}
                  />
                  <button style={styles.saveButton} onClick={() => saveEdit('githubUsername')}>
                    Save
                  </button>
                </div>
              ) : (
                <div style={styles.nameRow}>
                  <h1 style={styles.name}>{resumeData.githubUsername || 'Your Name'}</h1>
                  <button style={styles.editButtonSmall} onClick={() => startEditing('githubUsername')}>
                    ✎
                  </button>
                </div>
              )}
              <p style={styles.headline}>Software Developer</p>
            </div>
            <button onClick={handleGeneratePDF} disabled={localIsLoading} style={styles.pdfButton}>
              {localIsLoading ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>

          {/* Contact Info */}
          <div style={styles.contactGrid}>
            {['email', 'mobile', 'linkedin'].map((field) => (
              <div key={field} style={styles.contactItem}>
                <span style={styles.contactIcon}>
                  {field === 'email' ? '✉' : field === 'mobile' ? '📱' : '🔗'}
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
                      onClick={() => saveEdit('ContactInfo', null, field)}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div style={styles.contactViewRow}>
                    <span style={styles.contactValue}>
                      {resumeData.contactInfo?.[field] ? (
                        <a
                          href={
                            field === 'email'
                              ? `mailto:${resumeData.contactInfo[field]}`
                              : field === 'mobile'
                              ? `tel:${resumeData.contactInfo[field]}`
                              : resumeData.contactInfo[field]
                          }
                          target={field === 'linkedin' ? '_blank' : undefined}
                          rel={field === 'linkedin' ? 'noopener noreferrer' : undefined}
                          style={styles.link}
                        >
                          {field === 'linkedin' ? 'LinkedIn Profile' : resumeData.contactInfo[field]}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </span>
                    <button
                      style={styles.editButtonTiny}
                      onClick={() => startEditing('ContactInfo', null, field)}
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
        <Section title="Summary" icon="📝" expanded={expandedSections.summary} onToggle={() => toggleSection('summary')}>
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
              <p style={styles.text}>{resumeData.summary || aiOverview || 'No summary available'}</p>
              <button style={styles.editButtonSmall} onClick={() => startEditing('Summary')}>
                ✎
              </button>
            </div>
          )}
        </Section>

        {/* Skills Section */}
        <Section title="Skills" icon="⚡" expanded={expandedSections.skills} onToggle={() => toggleSection('skills')}>
          {isEditing.Skills ? (
            <div style={styles.editContainer}>
              <textarea
                style={styles.textarea}
                value={editValues.Skills || ''}
                onChange={(e) => handleEditChange('Skills', e.target.value)}
                rows="4"
                placeholder="Enter skills, separated by commas"
              />
              <button style={styles.saveButtonLarge} onClick={() => saveEdit('Skills')}>
                Save
              </button>
            </div>
          ) : (
            <div>
              <div style={styles.skillsContainer}>
                {resumeData.skills?.items?.length ? (
                  resumeData.skills.items.map((skill, index) => (
                    <span key={index} style={styles.skillTag}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <p style={styles.noData}>No skills available</p>
                )}
              </div>
              <button style={styles.editButtonSmall} onClick={() => startEditing('Skills')}>
                ✎ Edit Skills
              </button>
            </div>
          )}
        </Section>

        {/* Projects Section */}
        <Section title="Projects" icon="🚀" expanded={expandedSections.projects} onToggle={() => toggleSection('projects')}>
          <button style={styles.addButton} onClick={() => addItem('Projects')}>
            ➕ Add Project
          </button>
          {resumeData.projects?.items?.length ? (
            resumeData.projects.items.map((project, index) => (
              <div key={index} style={styles.projectCard}>
                <div style={styles.projectHeader}>
                  <div style={styles.projectLeft}>
                    {['name', 'html_url', 'description', 'language'].map((field) => (
                      <div key={field} style={styles.projectField}>
                        {isEditing[`Projects_${index}_${field}`] ? (
                          <div style={styles.editContainer}>
                            <input
                              style={styles.projectNameInput}
                              value={editValues[`Projects_${index}_${field}`] || ''}
                              onChange={(e) => handleEditChange(`Projects_${index}_${field}`, e.target.value)}
                              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            />
                            <button
                              style={styles.saveButtonSmall}
                              onClick={() => saveEdit('Projects', index, field)}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div style={styles.viewRow}>
                            {field === 'name' ? (
                              <a href={project.html_url} style={styles.projectName}>
                                {project.name || 'Project Name'}
                              </a>
                            ) : field === 'html_url' ? (
                              <span style={styles.description}>{project[field] || 'No URL'}</span>
                            ) : field === 'description' ? (
                              <p style={styles.description}>{project[field] || 'No description'}</p>
                            ) : (
                              <span style={styles.language}>{project[field] || 'N/A'}</span>
                            )}
                            <button
                              style={styles.editButtonTiny}
                              onClick={() => startEditing('Projects', index, field)}
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={styles.projectMeta}>
                      <span style={styles.stars}>⭐ {project.stargazers_count || 0}</span>
                    </div>
                  </div>
                  <button style={styles.removeButton} onClick={() => removeItem('Projects', index)}>
                    ✕
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={styles.noData}>No projects available</p>
          )}
        </Section>

        {/* Experience Section */}
        <Section title="Experience" icon="💼" expanded={expandedSections.experience} onToggle={() => toggleSection('experience')}>
          <button style={styles.addButton} onClick={() => addItem('Experience')}>
            ➕ Add Experience
          </button>
          {resumeData.experience?.items?.length ? (
            resumeData.experience.items.map((exp, index) => (
              <div key={index} style={styles.projectCard}>
                <div style={styles.projectHeader}>
                  <div style={styles.projectLeft}>
                    {['title', 'company', 'dates', 'description'].map((field) => (
                      <div key={field} style={styles.projectField}>
                        {isEditing[`Experience_${index}_${field}`] ? (
                          <div style={styles.editContainer}>
                            <input
                              style={styles.projectNameInput}
                              value={editValues[`Experience_${index}_${field}`] || ''}
                              onChange={(e) => handleEditChange(`Experience_${index}_${field}`, e.target.value)}
                              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                            />
                            <button
                              style={styles.saveButtonSmall}
                              onClick={() => saveEdit('Experience', index, field)}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div style={styles.viewRow}>
                            {field === 'title' ? (
                              <h3 style={styles.expTitle}>{exp[field] || 'Title'}</h3>
                            ) : field === 'description' ? (
                              <p style={styles.description}>{exp[field] || 'No description'}</p>
                            ) : (
                              <span style={field === 'company' ? styles.company : styles.dates}>
                                {exp[field] || (field === 'company' ? 'Company' : 'Dates')}
                              </span>
                            )}
                            <button
                              style={styles.editButtonTiny}
                              onClick={() => startEditing('Experience', index, field)}
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button style={styles.removeButton} onClick={() => removeItem('Experience', index)}>
                    ✕
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={styles.noData}>No experience available</p>
          )}
        </Section>

        {/* Education, Certifications, Hobbies, and Custom Sections */}
        {['Education', 'Certifications', 'Hobbies'].map((section) => (
          <Section
            key={section}
            title={section}
            icon={section === 'Education' ? '🎓' : section === 'Certifications' ? '📜' : '🎨'}
            expanded={expandedSections[section.toLowerCase()]}
            onToggle={() => toggleSection(section.toLowerCase())}
          >
            {isEditing[section] ? (
              <div style={styles.editContainer}>
                <textarea
                  style={styles.textarea}
                  value={editValues[section] || ''}
                  onChange={(e) => handleEditChange(section, e.target.value)}
                  rows="4"
                  placeholder={`Enter ${section.toLowerCase()}`}
                />
                <button style={styles.saveButtonLarge} onClick={() => saveEdit(section)}>
                  Save
                </button>
              </div>
            ) : (
              <div style={styles.viewRow}>
                <p style={styles.text}>
                  {section === 'Education'
                    ? formatEducation(resumeData.education)
                    : section === 'Hobbies'
                    ? formatHobbies(resumeData.hobbies)
                    : resumeData[section.toLowerCase()]?.items?.join(', ') || `No ${section.toLowerCase()} available`}
                </p>
                <button style={styles.editButtonSmall} onClick={() => startEditing(section)}>
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
    <button onClick={onToggle} style={styles.sectionHeader}>
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
  container: { padding: '20px', background: '#f5f7fa' },
  content: { maxWidth: '900px', margin: '0 auto' },
  loadingContainer: { textAlign: 'center', padding: '50px' },
  errorContainer: { textAlign: 'center', padding: '50px', color: '#ff0000' },
  goBackButton: { padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  headerCard: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '20px' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flex: 1 },
  nameRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  name: { fontSize: '24px', fontWeight: 'bold' },
  headline: { color: '#666', fontSize: '16px' },
  pdfButton: { padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  contactGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '20px' },
  contactItem: { display: 'flex', alignItems: 'center', gap: '10px' },
  contactIcon: { fontSize: '18px' },
  contactEditRow: { display: 'flex', gap: '10px', flex: 1 },
  contactInput: { flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '5px' },
  contactViewRow: { display: 'flex', gap: '10px', flex: 1 },
  contactValue: { flex: 1 },
  link: { color: '#007bff', textDecoration: 'none' },
  section: { background: '#fff', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  sectionHeader: { width: '100%', padding: '15px', background: '#f9f9f9', border: 'none', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '10px' },
  sectionIcon: { fontSize: '20px' },
  sectionTitleText: { fontSize: '20px', fontWeight: 'bold' },
  chevron: { fontSize: '16px' },
  sectionContent: { padding: '15px' },
  editingRow: { display: 'flex', gap: '10px' },
  nameInput: { fontSize: '20px', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' },
  saveButton: { padding: '8px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  saveButtonSmall: { padding: '6px 10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  saveButtonLarge: { padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  editButtonSmall: { padding: '6px 10px', background: '#f0f0f0', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  editButtonTiny: { padding: '4px 8px', background: '#f0f0f0', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  viewRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  text: { flex: 1, margin: 0 },
  editContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  textarea: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', resize: 'vertical' },
  skillsContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  skillTag: { padding: '5px 10px', background: '#e9ecef', borderRadius: '15px' },
  noData: { color: '#999', fontStyle: 'italic' },
  addButton: { padding: '8px 15px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px' },
  projectCard: { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '10px' },
  projectHeader: { display: 'flex', justifyContent: 'space-between', gap: '10px' },
  projectLeft: { flex: 1 },
  projectField: { marginBottom: '10px' },
  projectName: { fontSize: '18px', fontWeight: 'bold', color: '#007bff', textDecoration: 'none' },
  projectNameInput: { fontSize: '16px', padding: '8px', border: '1px solid #ccc', borderRadius: '5px', width: '100%' },
  projectMeta: { display: 'flex', gap: '10px', color: '#666' },
  stars: { display: 'flex', alignItems: 'center', gap: '5px' },
  language: { padding: '2px 8px', background: '#e9ecef', borderRadius: '5px' },
  description: { margin: 0, color: '#333' },
  removeButton: { padding: '5px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  expTitle: { fontSize: '18px', fontWeight: 'bold', margin: 0 },
  company: { color: '#007bff', fontWeight: '600' },
  dates: { color: '#666' },
};

export default ResultsPage;