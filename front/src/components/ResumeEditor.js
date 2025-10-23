import React, { useState } from 'react';
import axios from 'axios';

const ResumeEditor = () => {
  const [formData, setFormData] = useState({
    githubUser: '',
    contactInfo: { email: '', mobile: '', linkedin: '' },
    customSections: {}
  });
  const [selectedSection, setSelectedSection] = useState('');
  const [sectionContent, setSectionContent] = useState('');
  const [sectionItems, setSectionItems] = useState([]);
  const [projectOrExperience, setProjectOrExperience] = useState([]);

  // Available sections for editing
  const sections = [
    'Summary',
    'Skills',
    'Projects',
    'Experience',
    'Education',
    'Certifications',
    'Hobbies'
  ];

  // Handle section selection
  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
    setSectionContent('');
    setSectionItems([]);
    setProjectOrExperience([]);
  };

  // Handle input changes for basic fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('contactInfo.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        contactInfo: { ...formData.contactInfo, [field]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle content for text-based sections (Summary, Education, Hobbies)
  const handleContentChange = (e) => {
    setSectionContent(e.target.value);
  };

  // Handle items for list-based sections (Skills, Certifications)
  const handleItemsChange = (e) => {
    setSectionItems(e.target.value.split(',').map(item => item.trim()).filter(item => item));
  };

  // Add a new Project or Experience entry
  const addProjectOrExperience = () => {
    setProjectOrExperience([...projectOrExperience, {
      name: '', // For Projects
      title: '', // For Experience
      company: '', // For Experience
      html_url: '', // For Projects
      description: '',
      language: '', // For Projects
      stargazers_count: 0, // For Projects
      created_at: '', // For Projects
      pushed_at: '', // For Projects
      dates: '' // For Experience
    }]);
  };

  // Handle changes to Project/Experience items
  const handleProjectOrExperienceChange = (index, field, value) => {
    const updatedItems = [...projectOrExperience];
    updatedItems[index][field] = field === 'stargazers_count' ? parseInt(value) || 0 : value;
    setProjectOrExperience(updatedItems);
  };

  // Add section to customSections
  const addSection = () => {
    if (!selectedSection) return;
    const updatedSections = { ...formData.customSections };
    if (['Summary', 'Education', 'Hobbies'].includes(selectedSection)) {
      if (sectionContent) {
        updatedSections[selectedSection] = { content: sectionContent };
      }
    } else if (['Skills', 'Certifications'].includes(selectedSection)) {
      if (sectionItems.length) {
        updatedSections[selectedSection] = { items: sectionItems };
      }
    } else if (['Projects', 'Experience'].includes(selectedSection)) {
      if (projectOrExperience.length) {
        updatedSections[selectedSection] = { items: projectOrExperience };
      }
    }
    setFormData({ ...formData, customSections: updatedSections });
    // Reset inputs
    setSectionContent('');
    setSectionItems([]);
    setProjectOrExperience([]);
  };

  // Submit to backend for PDF generation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/api/export-pdf', {
        ...formData,
        template: 'Modern'
      }, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formData.githubUser || 'resume'}_resume.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating resume:', error);
      alert('Failed to generate resume. Check console for details.');
    }
  };

  // Basic styling for the form
  const formStyle = {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px'
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#9d00ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
  };

  return (
    <div style={formStyle}>
      <h2>Edit Resume Sections</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>GitHub Username:</label>
          <input
            type="text"
            name="githubUser"
            value={formData.githubUser}
            onChange={handleInputChange}
            placeholder="GitHub Username"
            style={inputStyle}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="contactInfo.email"
            value={formData.contactInfo.email}
            onChange={handleInputChange}
            placeholder="Email"
            style={inputStyle}
          />
        </div>
        <div>
          <label>Mobile:</label>
          <input
            type="text"
            name="contactInfo.mobile"
            value={formData.contactInfo.mobile}
            onChange={handleInputChange}
            placeholder="Mobile"
            style={inputStyle}
          />
        </div>
        <div>
          <label>LinkedIn:</label>
          <input
            type="url"
            name="contactInfo.linkedin"
            value={formData.contactInfo.linkedin}
            onChange={handleInputChange}
            placeholder="LinkedIn URL"
            style={inputStyle}
          />
        </div>
        <div>
          <label>Select Section to Edit:</label>
          <select value={selectedSection} onChange={handleSectionChange} style={inputStyle}>
            <option value="">Select a section</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>

        {selectedSection && (
          <>
            {['Summary', 'Education', 'Hobbies'].includes(selectedSection) && (
              <div>
                <label>Content:</label>
                <textarea
                  value={sectionContent}
                  onChange={handleContentChange}
                  placeholder={`Enter content for ${selectedSection}`}
                  rows="4"
                  style={inputStyle}
                />
              </div>
            )}
            {['Skills', 'Certifications'].includes(selectedSection) && (
              <div>
                <label>Items (comma-separated):</label>
                <input
                  type="text"
                  value={sectionItems.join(', ')}
                  onChange={handleItemsChange}
                  placeholder={`Enter items for ${selectedSection} (e.g., Python, React)`}
                  style={inputStyle}
                />
              </div>
            )}
            {['Projects', 'Experience'].includes(selectedSection) && (
              <div>
                <button type="button" onClick={addProjectOrExperience} style={buttonStyle}>
                  Add {selectedSection === 'Projects' ? 'Project' : 'Experience'}
                </button>
                {projectOrExperience.map((item, index) => (
                  <div key={index} style={{ marginTop: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
                    {selectedSection === 'Projects' ? (
                      <>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleProjectOrExperienceChange(index, 'name', e.target.value)}
                          placeholder="Project Name"
                          style={inputStyle}
                        />
                        <input
                          type="url"
                          value={item.html_url}
                          onChange={(e) => handleProjectOrExperienceChange(index, 'html_url', e.target.value)}
                          placeholder="Project URL"
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={item.language}
                          onChange={(e) => handleProjectOrExperienceChange(index, 'language', e.target.value)}
                          placeholder="Language"
                          style={inputStyle}
                        />
                        <input
                          type="number"
                          value={item.stargazers_count}
                          onChange={(e) => handleProjectOrExperienceChange(index, 'stargazers_count', e.target.value)}
                          placeholder="Stars"
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={item.created_at}
                          onChange={(e) => handleProjectOrExperienceChange(index, 'created_at', e.target.value)}
                          placeholder="Created At (e.g., 2023-01-01)"
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={item.pushed_at}
                          onChange={(e) => handleProjectOrExperienceChange(index, 'pushed_at', e.target.value)}
                          placeholder="Last Updated (e.g., 2023-12-01)"
                          style={inputStyle}
                        />
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleProjectOrExperienceChange(index, 'title', e.target.value)}
                          placeholder="Job Title"
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={item.company}
                          onChange={(e) => handleProjectOrExperienceChange(index, 'company', e.target.value)}
                          placeholder="Company"
                          style={inputStyle}
                        />
                        <input
                          type="text"
                          value={item.dates}
                          onChange={(e) => handleProjectOrExperienceChange(index, 'dates', e.target.value)}
                          placeholder="Dates (e.g., 2023-2025)"
                          style={inputStyle}
                        />
                      </>
                    )}
                    <textarea
                      value={item.description}
                      onChange={(e) => handleProjectOrExperienceChange(index, 'description', e.target.value)}
                      placeholder="Description"
                      rows="3"
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={addSection} style={buttonStyle}>
              Add {selectedSection} to Resume
            </button>
          </>
        )}

        <button type="submit" style={{ ...buttonStyle, marginTop: '20px' }}>
          Generate Resume (PDF)
        </button>
      </form>

      <h3>Current Resume Data</h3>
      <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(formData, null, 2)}
      </pre>
    </div>
  );
};

export default ResumeEditor;