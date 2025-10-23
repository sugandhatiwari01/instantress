// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import InputPage from "./components/InputPage";
import ResultsPage from "./components/ResultsPage";
import About from "./components/About";
import Contact from "./components/Contact";
import "./App.css";

function App() {
  const [data, setData] = useState(null);
  const [aiOverview, setAiOverview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("ATS-friendly");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
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
    </Router>
  );
}

export default App;