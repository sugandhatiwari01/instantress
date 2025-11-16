import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ImproveExperience() {
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const enhanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:4000/api/enhance-experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience, education }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "AI enhancement failed");

      // Send enhanced data to ResultsPage
      navigate("/results", {
        state: {
          aiEnhancedExperience: json.enhancedExperience,
          aiEnhancedEducation: json.enhancedEducation,
        },
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Improve Your Experience & Education</h1>

      <label>Enter Your Experience</label>
      <textarea
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        placeholder="Describe your job, internships, or projects..."
        style={{ width: "100%", height: 120, marginBottom: 20 }}
      />

      <label>Enter Your Education</label>
      <textarea
        value={education}
        onChange={(e) => setEducation(e.target.value)}
        placeholder="Degree, institute, achievements..."
        style={{ width: "100%", height: 120, marginBottom: 20 }}
      />

      <button
        onClick={enhanceData}
        disabled={loading}
        style={{
          padding: "12px 20px",
          background: "#6D28D9",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        {loading ? "Enhancing…" : "Enhance with AI"}
      </button>
    </div>
  );
}
