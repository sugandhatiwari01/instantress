import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LinkedInLogin from './LinkedInLogin';
import './InputPage.css';

const InputPage = ({ setData, setAiOverview, setError, setIsLoading, setSelectedTemplate }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    githubUsername: '',
    leetcodeUser: '',
    linkedinUrl: '',
    template: 'ATS-friendly',
    contactInfo: {
      email: '',
      mobile: '',
      linkedin: ''
    }
  });
  const [localError, setLocalError] = useState('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [linkedInProfile, setLinkedInProfile] = useState(null);
  const [publicPreview, setPublicPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Check OAuth session on mount
useEffect(() => {
  const fetchLinkedInProfile = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/linkedin/profile', {
        withCredentials: true
      });
      console.log('✅ LinkedIn session active:', response.data);
      setLinkedInProfile(response.data);
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          linkedin: `https://www.linkedin.com/in/${response.data.vanityName || response.data.sub || ''}`,
          email: response.data.email || prev.contactInfo.email,
        }
      }));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('No LinkedIn session - click "Sign in" to login');
      } else {
        console.error('Profile fetch error:', error);
      }
    }
  };
  fetchLinkedInProfile();
}, []);

  // Fetch public LinkedIn preview when URL changes
useEffect(() => {
  const url = formData.contactInfo.linkedin.trim();
  if (!url || !url.includes('linkedin.com/in/')) {
    setPublicPreview(null);
    return;
  }

  const timer = setTimeout(async () => {
    try {
const res = await axios.post('http://localhost:4000/api/linkedin/public', { url });      setPublicPreview(res.data);
      setShowPreview(true);
    } catch (err) {
      console.log('Public preview failed (normal for private profiles)');
      setPublicPreview(null);
    }
  }, 800);

  return () => clearTimeout(timer);
}, [formData.contactInfo.linkedin]);

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

  const handleTemplateChange = (e) => {
    setFormData({ ...formData, template: e.target.value });
    setSelectedTemplate(e.target.value);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.githubUsername) {
    setLocalError('GitHub Username is required');
    setError('GitHub Username is required');
    return;
  }

  setLocalIsLoading(true);
  setIsLoading(true);
  setLocalError('');
  setError('');

  try {
    const response = await axios.post('http://localhost:4000/api/process-data', {
      ...formData,
      linkedinUrl: formData.contactInfo.linkedin,
    }, { withCredentials: true });  // Add this!

    setData(response.data);
    setAiOverview(response.data.summary || '');
    navigate('/results');
  } catch (err) {
    const errorMessage = err.response?.data?.error || 'Failed to process data';
    setLocalError(errorMessage);
    setError(errorMessage);
  } finally {
    setLocalIsLoading(false);
    setIsLoading(false);
  }
};
  return (
    <div className="input-page">
      <h1>Start Your Resume</h1>
      {localError && <p className="error">{localError}</p>}
      {localIsLoading && <p>Loading...</p>}

      {/* Public Preview Modal */}
      {showPreview && publicPreview && (
        <div className="preview-modal" onClick={() => setShowPreview(false)}>
          <div className="preview-card" onClick={e => e.stopPropagation()}>
            <img src={publicPreview.image} alt="Profile" />
            <h3>{publicPreview.name}</h3>
            <p>{publicPreview.headline}</p>
            {publicPreview.worksFor?.[0] && (
              <p><strong>{publicPreview.worksFor[0].jobTitle}</strong> at {publicPreview.worksFor[0].company}</p>
            )}
            <div className="preview-actions">
              <button onClick={() => setShowPreview(false)}>Close</button>
              {!linkedInProfile && <LinkedInLogin text="Sign in for full data" />}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>GitHub Username:</label>
          <input
            type="text"
            name="githubUsername"
            value={formData.githubUsername}
            onChange={handleInputChange}
            placeholder="e.g., octocat"
            required
          />
        </div>

        <div className="form-group">
          <label>LeetCode Username (Optional):</label>
          <input
            type="text"
            name="leetcodeUser"
            value={formData.leetcodeUser}
            onChange={handleInputChange}
            placeholder="e.g., your-leetcode-username"
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="contactInfo.email"
            value={formData.contactInfo.email}
            onChange={handleInputChange}
            placeholder="e.g., user@example.com"
          />
        </div>

        <div className="form-group">
          <label>Mobile:</label>
          <input
            type="text"
            name="contactInfo.mobile"
            value={formData.contactInfo.mobile}
            onChange={handleInputChange}
            placeholder="e.g., +91 1234567890"
          />
        </div>

        <div className="form-group">
          <label>LinkedIn (Optional):</label>
          <div className="linkedin-input-group">
            <input
              type="url"
              name="contactInfo.linkedin"
              value={formData.contactInfo.linkedin}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/username"
            />
            {publicPreview && (
              <span className="preview-hint">
                👤 {publicPreview.name.split(' ')[0]}'s profile detected
              </span>
            )}
          </div>
          {!linkedInProfile && (
            <div style={{ marginTop: '8px' }}>
              <LinkedInLogin text="Sign in with LinkedIn to auto-fill" />
            </div>
          )}
          {linkedInProfile && (
            <p style={{ color: 'green', fontSize: '0.9em', marginTop: '8px' }}>
              ✅ Signed in as {linkedInProfile.firstName} {linkedInProfile.lastName}
            </p>
          )}
        </div>

        <div className="form-group">
          <label>Template:</label>
          <select name="template" value={formData.template} onChange={handleTemplateChange}>
            <option value="Minimal">Minimal</option>
            <option value="ATS-friendly">ATS-friendly</option>
            <option value="Modern">Modern</option>
          </select>
        </div>

        <button type="submit" disabled={localIsLoading}>
          {localIsLoading ? 'Processing...' : 'Fetch Data and Edit Resume'}
        </button>
      </form>

      
    </div>
  );
};

export default InputPage;