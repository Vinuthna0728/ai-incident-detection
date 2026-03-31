import React, { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const socketRef = useRef(null);
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  /* ================= AUTH LOGIC ================= */
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const url = isLogin ? "/login" : "/register";
      const res = await fetch(`${BASE_URL}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (isLogin) {
        if (!data.access_token) {
          toast.error(data.detail || "Login failed");
          return;
        }
        localStorage.setItem("token", data.access_token);
        setIsAuth(true);
        toast.success("Welcome back, Commander.");
      } else {
        toast.success("Registration successful! Please login.");
        setIsLogin(true);
      }
    } catch (err) {
      toast.error("Connection error to backend");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    if (socketRef.current) socketRef.current.close();
    window.location.reload();
  };

  /* ================= DATA FETCHING ================= */
  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem("token");
    if (!token || socketRef.current) return;

    const WS_URL = BASE_URL.replace(/^http/, "ws");
    socketRef.current = new WebSocket(`${WS_URL}/ws?token=${token}`);

    socketRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "ALERT") {
        const alert = msg.data;
        toast(`${alert.severity} Incident Detected!`, { icon: '🚨' });
        setAlerts((prev) => [alert, ...prev]);
        setIncidents((prev) => {
          if (prev.find((i) => i.id === alert.id)) return prev;
          return [alert, ...prev];
        });
      }
    };

    socketRef.current.onclose = () => {
        socketRef.current = null;
        setTimeout(connectWebSocket, 3000); // Auto-reconnect
    };
  };

  useEffect(() => {
    if (isAuth) {
      fetchData();
      connectWebSocket();
    }
  }, [isAuth]);

  /* ================= CALCULATIONS ================= */
  const totalIncidents = incidents.length;
  const highSeverityCount = incidents.filter((i) => i?.severity === "HIGH").length;
  const chartData = [
    { name: "Total", value: totalIncidents, color: "#0ea5e9" },
    { name: "High Priority", value: highSeverityCount, color: "#f43f5e" },
  ];

  /* ================= RENDER AUTH PAGE ================= */
  if (!isAuth) {
    return (
      <div style={authContainer}>
        <Toaster position="top-right" />
        <div style={authCard}>
          <h1 style={{ marginBottom: 10 }}>⚡ AI Ops</h1>
          <p style={{ color: "#94a3b8", marginBottom: 30 }}>
            {isLogin ? "Sign in to System Intelligence" : "Create your operator account"}
          </p>
          <form onSubmit={handleAuth} style={formStyle}>
            <input 
              style={inputStyle} 
              placeholder="Username" 
              onChange={(e) => setUsername(e.target.value)} 
              required
            />
            <input 
              style={inputStyle} 
              type="password" 
              placeholder="Password" 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
            <button type="submit" style={primaryBtn}>
              {isLogin ? "Access Dashboard" : "Register Now"}
            </button>
          </form>
          <button style={linkBtn} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  /* ================= RENDER MAIN DASHBOARD ================= */
  return (
    <div style={layout}>
      <Toaster position="top-right" />
      
      {/* SIDEBAR */}
      <aside style={sidebarStyle}>
        <div style={logoArea}>
          <span style={{ fontSize: "1.5rem" }}>⚡</span>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>AI Ops</h2>
        </div>
        <nav style={navStyle}>
          <div style={navItemActive}>📊 Dashboard</div>
          <div style={navItem}>🚨 Incidents</div>
          <div style={navItem}>📈 Analytics</div>
          <div style={navItem}>⚙️ Settings</div>
        </nav>
        <button onClick={handleLogout} style={logoutBtn}>Logout</button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={mainContent}>
        <header style={headerStyle}>
          <div>
            <h1 style={{ margin: 0 }}>System Intelligence</h1>
            <p style={{ color: "#64748b", margin: 0 }}>Real-time monitoring & predictive analysis</p>
          </div>
          <div style={liveBadge}>● LIVE</div>
        </header>

        {/* STATS CARDS */}
        <section style={statsGrid}>
          <div style={statCard}>
            <span style={statLabel}>ACTIVE INCIDENTS</span>
            <div style={statValue}>{totalIncidents}</div>
            <div style={{...statBar, background: "#0ea5e9"}} />
          </div>
          <div style={statCard}>
            <span style={statLabel}>HIGH PRIORITY</span>
            <div style={{...statValue, color: "#f43f5e"}}>{highSeverityCount}</div>
            <div style={{...statBar, background: "#f43f5e"}} />
          </div>
        </section>

        <section style={contentGrid}>
          {/* INCIDENT LOG */}
          <div style={glassCard}>
            <h3 style={cardTitle}>Incident Log</h3>
            <div style={tableWrapper}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRow}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>ROOT CAUSE</th>
                    <th style={thStyle}>SEVERITY</th>
                    <th style={thStyle}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} style={tableRow}>
                      <td style={tdStyle}>#{inc.id}</td>
                      <td style={tdStyle}>{inc.root_cause}</td>
                      <td style={tdStyle}>
                        <span style={inc.severity === "HIGH" ? badgeRed : badgeBlue}>
                          {inc.severity}
                        </span>
                      </td>
                      <td style={tdStyle}><span style={badgeGreen}>OPEN</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHART AREA */}
          <div style={glassCard}>
            <h3 style={cardTitle}>Traffic Distribution</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ALERTS PANEL */}
        <section style={{...glassCard, marginTop: '24px'}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={cardTitle}>🚨 Live Alerts</h3>
            <select style={selectStyle} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All Alerts</option>
              <option value="HIGH">Critical Only</option>
            </select>
          </div>
          <div style={alertList}>
            {alerts.length === 0 ? (
                <p style={{textAlign: 'center', color: '#475569', padding: '20px'}}>Awaiting system signals...</p>
            ) : (
                alerts.filter(a => filter === "ALL" || a.severity === filter).map((a, i) => (
                    <div key={i} style={alertItem}>
                        <span>{a.severity === 'HIGH' ? '🔴' : '🟡'}</span>
                        <span style={{flex: 1}}>{a.root_cause}</span>
                        <span style={{fontSize: '0.8rem', color: '#64748b'}}>Just now</span>
                    </div>
                ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ================= PREMIUM STYLES ================= */
const layout = {
  display: "flex",
  minHeight: "100vh",
  background: "#020617", // Darker slate
  color: "#f8fafc",
  fontFamily: "'Inter', sans-serif",
};

const authContainer = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: "#020617",
};

const authCard = {
  background: "#0f172a",
  padding: '40px',
  borderRadius: '16px',
  width: '380px',
  textAlign: 'center',
  border: '1px solid #1e293b',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
};

const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  fontSize: '1rem'
};

const primaryBtn = {
  padding: '12px',
  background: '#0ea5e9',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: '0.2s'
};

const sidebarStyle = {
  width: "240px",
  background: "#0f172a",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  borderRight: "1px solid #1e293b",
};

const navStyle = { marginTop: '40px', flex: 1 };
const navItem = { padding: '12px', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', marginBottom: '5px' };
const navItemActive = { ...navItem, background: '#1e293b', color: '#38bdf8' };

const mainContent = { flex: 1, padding: "40px", overflowY: "auto" };

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "32px",
};

const liveBadge = {
  background: 'rgba(34, 197, 94, 0.1)',
  color: '#22c55e',
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  border: '1px solid rgba(34, 197, 94, 0.2)'
};

const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px", marginBottom: '32px' };

const statCard = {
  background: "#0f172a",
  padding: "24px",
  borderRadius: "12px",
  border: "1px solid #1e293b",
  position: 'relative',
  overflow: 'hidden'
};

const statLabel = { fontSize: "0.75rem", color: "#64748b", fontWeight: "bold" };
const statValue = { fontSize: "2rem", fontWeight: "bold", marginTop: "8px" };
const statBar = { position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px' };

const contentGrid = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" };

const glassCard = {
  background: "#0f172a",
  padding: "24px",
  borderRadius: "12px",
  border: "1px solid #1e293b",
};

const cardTitle = { margin: "0 0 20px 0", fontSize: "1.1rem" };

const tableWrapper = { overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const thStyle = { padding: '12px', borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '0.8rem' };
const tdStyle = { padding: '16px 12px', borderBottom: '1px solid #1e293b', fontSize: '0.9rem' };

const badgeBlue = { background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' };
const badgeRed = { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' };
const badgeGreen = { background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' };

const alertItem = {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    background: '#1e293b',
    borderRadius: '8px',
    marginBottom: '10px',
    fontSize: '0.9rem'
};

const selectStyle = {
    background: '#1e293b',
    color: 'white',
    border: '1px solid #334155',
    padding: '4px 8px',
    borderRadius: '4px'
};

const logoutBtn = {
    padding: '10px',
    background: 'transparent',
    color: '#ef4444',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: 'auto'
};

const linkBtn = { background: 'none', border: 'none', color: '#38bdf8', marginTop: '15px', cursor: 'pointer' };