const LinkedInLogin = ({ text = "Sign in with LinkedIn" }) => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/auth/linkedin';
  };

  return (
    <button onClick={handleLogin} className="linkedin-btn">
      {text}
    </button>
  );
};
export default LinkedInLogin;