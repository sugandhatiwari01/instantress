import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy">
      <h1>Privacy Policy</h1>
      <p>Last updated: November 1, 2025</p>

      <section>
        <h2>1. Information We Collect</h2>
        <p>When you use InstantRes, we collect the following information:</p>
        <ul>
          <li>Basic profile information from LinkedIn (when you choose to connect)</li>
          <li>Email address</li>
          <li>Professional experience and education details</li>
          <li>Skills and certifications</li>
        </ul>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Generate your resume and portfolio</li>
          <li>Improve our resume generation service</li>
          <li>Communicate with you about your resume</li>
        </ul>
      </section>

      <section>
        <h2>3. Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information. Your data is encrypted in transit and at rest.</p>
      </section>

      <section>
        <h2>4. Third-Party Services</h2>
        <p>We integrate with:</p>
        <ul>
          <li>LinkedIn for professional profile data</li>
          <li>GitHub for project information (optional)</li>
          <li>LeetCode for coding achievements (optional)</li>
        </ul>
      </section>

      <section>
        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of data collection</li>
          <li>Export your data</li>
        </ul>
      </section>

      <section>
        <h2>6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p>Email: support@instantres.com</p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;