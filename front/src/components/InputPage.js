import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './InputPage.css';

const InputPage = ({ setData, setAiOverview, setError, setIsLoading, setSelectedTemplate }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    githubUsername: '',
    leetcodeUser: '',  // Changed from leetcodeUsername to match backend
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

  // Handle input changes
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

  // Handle template change
  const handleTemplateChange = (e) => {
    setFormData({ ...formData, template: e.target.value });
    setSelectedTemplate(e.target.value);
  };

  // Submit to backend and navigate to results
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
      console.log('Submitting form data:', formData);
      const response = await axios.post('http://localhost:4000/api/process-data', formData);
      console.log('Received response:', response.data);
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Set all the data before navigation
      setData(response.data);
      setAiOverview(response.data.summary || '');
      setError('');
      setLocalError('');
      setIsLoading(false);
      setLocalIsLoading(false);
      
      // Add a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to results
      navigate('/results');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to process data';
      setLocalError(errorMessage);
      setError(errorMessage);
      setLocalIsLoading(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="input-page">
      <h1>Start Your Resume</h1>
      {localError && <p className="error">{localError}</p>}
      {localIsLoading && <p>Loading...</p>}
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
          <input
            type="url"
            name="contactInfo.linkedin"
            value={formData.contactInfo.linkedin}
            onChange={handleInputChange}
            placeholder="e.g., https://linkedin.com/in/username"
          />
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