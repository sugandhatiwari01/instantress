// src/App.js
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import SplashScreen from "./components/SplashScreen";
import InputPage from "./components/InputPage";
import ResultsPage from "./components/ResultsPage";
import About from "./components/About";
import Contact from "./components/Contact";
import PrivacyPolicy from "./components/PrivacyPolicy";
import ImproveExperience from "./components/ImproveExperience";

import "./App.css";

function AppContent() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // ---------- LinkedIn OAuth callback ----------
  useEffect(() => {
    const userParam = searchParams.get("user");
    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        login(userData);
        // clean URL
        window.history.replaceState({}, "", window.location.pathname);
      } catch (e) {
        console.error("Failed to parse LinkedIn user", e);
      }
    }
  }, [searchParams, login]);

  // ---------- App-level state for resume ----------
  const [data, setData] = React.useState(null);
  const [aiOverview, setAiOverview] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] =
    React.useState("ATS-friendly");

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      <Route path="/improve-experience" element={<ImproveExperience />} />

      <Route
        path="/input"
        element={
          <InputPage
            setData={setData}
            setAiOverview={setAiOverview}
            setError={setError}
            setIsLoading={setIsLoading}
            setSelectedTemplate={setSelectedTemplate}
          />
        }
      />
      <Route
        path="/results"
        element={
          <ResultsPage
            data={data}
            error={error}
            isLoading={isLoading}
            aiOverview={aiOverview}
            selectedTemplate={selectedTemplate}
          />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
