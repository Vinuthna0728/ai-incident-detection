import { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function Login({ setToken }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const endpoint = isLogin ? "/login" : "/register";
    
    try {
      const res = await axios.post(`${BASE_URL}${endpoint}`, {
        username,
        password,
      });

      if (isLogin) {
        // 1. Save to storage
        localStorage.setItem("token", res.data.access_token);
        // 2. Update App.jsx state (This triggers the instant redirect)
        setToken(res.data.access_token);
        toast.success("Welcome back, Operator.");
      } else {
        toast.success("Registration successful! Please login.");
        setIsLogin(true); // Switch to login view after registering
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Authentication failed";
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Toaster position="top-center" />
      
      <div style={cardStyle}>
        <div style={logoStyle}>⚡ AI Ops</div>
        <h2 style={titleStyle}>{isLogin ? "System Login" : "Create Account"}</h2>
        <p style={subtitleStyle}>
          {isLogin ? "Enter credentials to access dashboard" : "Register a new system operator"}
        </p>

        <form onSubmit={handleAuth} style={formStyle}>
          <input
            style={inputStyle}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Processing..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)} 
          style={toggleButtonStyle}
        >
          {isLogin ? "New user? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

/* ================= THEME STYLES ================= */
const containerStyle = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#020617", // Matches dashboard background
  fontFamily: "'Inter', sans-serif",
};

const cardStyle = {
  backgroundColor: "#0f172a",
  padding: "40px",
  borderRadius: "12px",
  border: "1px solid #1e293b",
  width: "100%",
  maxWidth: "360px",
  textAlign: "center",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
};

const logoStyle = {
  fontSize: "1.5rem",
  fontWeight: "bold",
  color: "#38bdf8",
  marginBottom: "20px",
};

const titleStyle = {
  color: "#f8fafc",
  margin: "0 0 8px 0",
  fontSize: "1.25rem",
};

const subtitleStyle = {
  color: "#64748b",
  fontSize: "0.875rem",
  marginBottom: "24px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const inputStyle = {
  padding: "12px 16px",
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "8px",
  color: "#f8fafc",
  fontSize: "1rem",
  outline: "none",
};

const buttonStyle = {
  padding: "12px",
  backgroundColor: "#38bdf8",
  color: "#0f172a",
  border: "none",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
  marginTop: "8px",
  transition: "opacity 0.2s",
};

const toggleButtonStyle = {
  background: "none",
  border: "none",
  color: "#94a3b8",
  marginTop: "20px",
  cursor: "pointer",
  fontSize: "0.85rem",
  textDecoration: "underline",
};