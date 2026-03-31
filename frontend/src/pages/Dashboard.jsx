import React, { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";

export default function Dashboard() {
  // 1. Check for token immediately on load
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));
  const [isLoginView, setIsLoginView] = useState(true);
  const [creds, setCreds] = useState({ username: "", password: "" });

  const [incidents, setIncidents] = useState([]);
  const socketRef = useRef(null);
  const BASE_URL = import.meta.env.VITE_API_URL;

  /* ================= AUTH LOGIC ================= */
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginView ? "/login" : "/register";
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();

      if (isLoginView) {
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
          setIsAuth(true); // This will trigger the useEffect and switch the UI
          toast.success("Systems Online");
        } else {
          toast.error(data.detail || "Login Failed");
        }
      } else {
        toast.success("Registered! Please login.");
        setIsLoginView(true);
      }
    } catch (err) {
      toast.error("Connection Error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false); // Instantly switches UI back to Login view
    if (socketRef.current) socketRef.current.close();
  };

  /* ================= DATA FETCHING ================= */
  useEffect(() => {
    if (!isAuth) return;

    const token = localStorage.getItem("token");
    
    // Fetch initial history
    fetch(`${BASE_URL}/incidents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setIncidents(Array.isArray(data) ? data : []));

    // WebSocket connection
    const WS_URL = BASE_URL.replace(/^http/, "ws");
    socketRef.current = new WebSocket(`${WS_URL}/ws?token=${token}`);

    socketRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "ALERT") {
        setIncidents(prev => [msg.data, ...prev]);
        toast.error(`ALERT: ${msg.data.root_cause}`);
      }
    };

    return () => socketRef.current?.close();
  }, [isAuth, BASE_URL]);

  /* ================= CONDITIONAL RENDERING ================= */
  
  // If NOT authenticated, show ONLY the Login/Register card
  if (!isAuth) {
    return (
      <div style={authWrapperStyle}>
        <Toaster />
        <div style={authCardStyle}>
          <h2 style={{ color: "#38bdf8", marginBottom: "10px" }}>⚡ AI Ops Login</h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "20px" }}>
            {isLoginView ? "Enter credentials to access intelligence" : "Create a new operator account"}
          </p>
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input 
              style={inputStyle} 
              placeholder="Username" 
              onChange={e => setCreds({...creds, username: e.target.value})}
              required 
            />
            <input 
              style={inputStyle} 
              type="password" 
              placeholder="Password" 
              onChange={e => setCreds({...creds, password: e.target.value})}
              required 
            />
            <button type="submit" style={submitButtonStyle}>
              {isLoginView ? "Login" : "Register"}
            </button>
          </form>
          <button onClick={() => setIsLoginView(!isLoginView)} style={toggleButtonStyle}>
            {isLoginView ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  // If authenticated, show the Dashboard
  return (
    <div style={dashboardLayoutStyle}>
      <Toaster />
      <aside style={sidebarStyle}>
        <div style={logoAreaStyle}>⚡ AI Ops</div>
        <nav style={{ flex: 1, marginTop: "20px" }}>
          <div style={navActiveStyle}>📊 Dashboard</div>
          <div style={navItemStyle}>🚨 Incidents</div>
          <div style={navItemStyle}>⚙️ Settings</div>
        </nav>
        <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
      </aside>

      <main style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
          <h1 style={{ fontSize: "1.5rem" }}>System Intelligence</h1>
          <div style={liveBadgeStyle}>● LIVE</div>
        </header>

        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>TOTAL INCIDENTS</div>
            <div style={statValueStyle}>{incidents.length}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>HIGH SEVERITY</div>
            <div style={{ ...statValueStyle, color: "#f43f5e" }}>
              {incidents.filter(i => i.severity === "HIGH").length}
            </div>
          </div>
        </div>

        <section style={tableContainerStyle}>
          <h3 style={{ marginBottom: "20px", color: "#94a3b8" }}>Recent Activity</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#475569", fontSize: "0.8rem" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>ROOT CAUSE</th>
                <th style={thStyle}>SEVERITY</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident, idx) => (
                <tr key={idx} style={trStyle}>
                  <td style={tdStyle}>#{incident.id || idx}</td>
                  <td style={tdStyle}>{incident.root_cause}</td>
                  <td style={tdStyle}>
                    <span style={incident.severity === "HIGH" ? highBadgeStyle : normalBadgeStyle}>
                      {incident.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

/* ================= PREMIUM STYLES ================= */
const authWrapperStyle = { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#020617" };
const authCardStyle = { background: "#0f172a", padding: "40px", borderRadius: "12px", border: "1px solid #1e293b", width: "350px", textAlign: "center" };
const inputStyle = { padding: "12px", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "white", fontSize: "0.9rem" };
const submitButtonStyle = { padding: "12px", background: "#38bdf8", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" };
const toggleButtonStyle = { background: "none", border: "none", color: "#64748b", marginTop: "15px", cursor: "pointer", fontSize: "0.8rem" };

const dashboardLayoutStyle = { display: "flex", height: "100vh", background: "#020617", color: "white", fontFamily: "Inter, sans-serif" };
const sidebarStyle = { width: "240px", background: "#0f172a", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: "20px" };
const logoAreaStyle = { fontSize: "1.2rem", fontWeight: "bold", color: "#38bdf8", paddingBottom: "20px", borderBottom: "1px solid #1e293b" };
const navItemStyle = { padding: "12px", color: "#94a3b8", cursor: "pointer", fontSize: "0.9rem" };
const navActiveStyle = { ...navItemStyle, background: "#1e293b", borderRadius: "8px", color: "#38bdf8" };
const logoutButtonStyle = { padding: "10px", border: "1px solid #ef4444", color: "#ef4444", background: "transparent", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem" };

const statsGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" };
const statCardStyle = { background: "#0f172a", padding: "20px", borderRadius: "12px", border: "1px solid #1e293b" };
const statLabelStyle = { fontSize: "0.7rem", color: "#64748b", fontWeight: "bold" };
const statValueStyle = { fontSize: "2rem", fontWeight: "bold", marginTop: "5px" };

const tableContainerStyle = { background: "#0f172a", padding: "25px", borderRadius: "12px", border: "1px solid #1e293b" };
const thStyle = { padding: "12px", borderBottom: "1px solid #1e293b" };
const tdStyle = { padding: "15px 12px", borderBottom: "1px solid #1e293b", fontSize: "0.85rem" };
const trStyle = { transition: "0.3s" };
const liveBadgeStyle = { background: "#064e3b", color: "#34d399", padding: "4px 12px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "bold" };
const normalBadgeStyle = { background: "#1e293b", padding: "4px 8px", borderRadius: "4px", fontSize: "0.7rem" };
const highBadgeStyle = { background: "#451a1a", color: "#f43f5e", padding: "4px 8px", borderRadius: "4px", fontSize: "0.7rem" };