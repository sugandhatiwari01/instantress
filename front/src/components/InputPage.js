import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LinkedInLogin from "./LinkedInLogin";
import "./InputPage.css";

const InputPage = ({
  setData,
  setAiOverview,
  setError,
  setIsLoading,
  setSelectedTemplate,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    githubUsername: "",
    leetcodeUser: "",
    linkedinUrl: "",
    template: "ATS-friendly",
    contactInfo: {
      email: "",
      mobile: "",
      linkedin: "",
    },
  });
  const [localError, setLocalError] = useState("");
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [linkedInProfile, setLinkedInProfile] = useState(null);
  const [publicPreview, setPublicPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchLinkedInProfile = async () => {
      try {
        const response = await axios.get(
          "http://localhost:4000/api/linkedin/profile",
          { withCredentials: true }
        );
        setLinkedInProfile(response.data);
        setFormData((prev) => ({
          ...prev,
          contactInfo: {
            ...prev.contactInfo,
            linkedin: `https://www.linkedin.com/in/${
              response.data.vanityName || response.data.sub || ""
            }`,
            email: response.data.email || prev.contactInfo.email,
          },
        }));
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("Profile fetch error:", error);
        }
      }
    };
    fetchLinkedInProfile();
  }, []);

  useEffect(() => {
    const url = formData.contactInfo.linkedin.trim();
    if (!url || !url.includes("linkedin.com/in/")) {
      setPublicPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.post(
          "http://localhost:4000/api/linkedin/public",
          { url }
        );
        setPublicPreview(res.data);
        setShowPreview(true);
      } catch {
        setPublicPreview(null);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.contactInfo.linkedin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("contactInfo.")) {
      const field = name.split(".")[1];
      setFormData({
        ...formData,
        contactInfo: { ...formData.contactInfo, [field]: value },
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
      setLocalError("GitHub username is required.");
      setError("GitHub username is required.");
      return;
    }

    setLocalIsLoading(true);
    setIsLoading(true);
    setLocalError("");
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:4000/api/process-data",
        {
          ...formData,
          linkedinUrl: formData.contactInfo.linkedin,
        },
        { withCredentials: true }
      );

      let leetcodeData = null;
      if (formData.leetcodeUser) {
        try {
          const lcResponse = await axios.post(
            "http://localhost:4000/api/leetcode",
            { username: formData.leetcodeUser }
          );
          leetcodeData = lcResponse.data;
        } catch (err) {
          console.warn("LeetCode fetch failed:", err.message);
        }
      }

      const finalData = { ...response.data, leetcodeData };
      setData(finalData);
      setAiOverview(response.data.summary || "");
      navigate("/results");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to process data.";
      setLocalError(errorMessage);
      setError(errorMessage);
    } finally {
      setLocalIsLoading(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="input-wrapper">
      <div className="input-page">
        <h1 className="input-title">Start Your Journey</h1>
        <p className="input-subtitle">
          Fill in your details below to create a beautiful and professional resume.
        </p>

        {localError && <p className="error">{localError}</p>}
        {localIsLoading && (
          <p className="loading">Processing your information...</p>
        )}

        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label>
              GitHub Username <span>*</span>
            </label>
            <input
              type="text"
              name="githubUsername"
              value={formData.githubUsername}
              onChange={handleInputChange}
              placeholder="Enter your GitHub username"
              required
            />
          </div>

          <div className="form-group">
            <label>LeetCode Username</label>
            <input
              type="text"
              name="leetcodeUser"
              value={formData.leetcodeUser}
              onChange={handleInputChange}
              placeholder="Optional - your LeetCode username"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="contactInfo.email"
              value={formData.contactInfo.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Mobile</label>
            <input
              type="text"
              name="contactInfo.mobile"
              value={formData.contactInfo.mobile}
              onChange={handleInputChange}
              placeholder="e.g., +91 9876543210"
            />
          </div>

          <div className="form-group">
            <label>LinkedIn Profile</label>
            <input
              type="url"
              name="contactInfo.linkedin"
              value={formData.contactInfo.linkedin}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/username"
            />

            {!linkedInProfile && (
              <div className="linkedin-login">
                <LinkedInLogin text="Sign in with LinkedIn to auto-fill" />
              </div>
            )}
            {linkedInProfile && (
              <p className="success-msg">
                ✅ Signed in as {linkedInProfile.firstName}{" "}
                {linkedInProfile.lastName}
              </p>
            )}
          </div>

          <div className="form-group">
  <label>Resume Template</label>
  <select
    name="template"
    value={formData.template}
    onChange={handleTemplateChange}
  >
+ <option value="ATS-friendly">ATS Friendly</option>    <option value="Creative">Creative</option>
    <option value="Minimal">Minimal</option>
    <option value="Modern">Modern</option>
    <option value="Sidebar">Sidebar</option>   {/* NEW TEMPLATE */}
  </select>

  <small style={{ color: "#7a5836" }}>
    Choose how your resume will look.
  </small>
</div>



          <button
  type="submit"
  className="generate-btn"
  disabled={localIsLoading}
>
  {localIsLoading ? "Processing..." : "Generate Resume"}
</button>

        </form>
      </div>
    </div>
  );
};

export default InputPage;
