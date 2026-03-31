import React, { useEffect, useState, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";

export default function Dashboard({ setToken }) {
  const [incidents, setIncidents] = useState([]);
  const socketRef = useRef(null);
  const BASE_URL = import.meta.env.VITE_API_URL;

  // 1. Fetch initial history and setup WebSocket
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Fetch initial data
    const fetchIncidents = async () => {
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

    fetchIncidents();

    // Setup WebSocket for Live Monitoring
    const WS_URL = BASE_URL.replace(/^http/, "ws");
    socketRef.current = new WebSocket(`${WS_URL}/ws?token=${token}`);

    socketRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "ALERT") {
          const alert = msg.data;
          // Live Update: Add new alert to the top of the list
          setIncidents((prev) => [alert, ...prev]);
          toast.error(`ALERT: ${alert.root_cause}`, {
            style: { background: "#0f172a", color: "#f43f5e", border: "1px solid #f43f5e" }
          });
        }
      } catch (e) {
        console.error("WS Error:", e);
      }
    };

    return () => socketRef.current?.close();
  }, [BASE_URL]);

  // 2. Logic for Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null); // Triggers App.jsx to redirect to /login immediately
    toast.success("Session Terminated");
  };

  // 3. Data for Charts
  const highCount = incidents.filter(i => i.severity === "HIGH").length;
  const chartData = [
    { name: "Total", value: incidents.length, color: "#38bdf8" },
    { name: "High", value: highCount, color: "#f43f5e" },
  ];

  return (
    <div style={layoutStyle}>
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <div style={logoAreaStyle}>⚡ AI Ops</div>
        <nav style={{ flex: 1, marginTop: "30px" }}>
          <div style={navActiveStyle}>📊 Dashboard</div>
          <div style={navItemStyle}>🚨 Incidents</div>
          <div style={navItemStyle}>📈 Analytics</div>
          <div style={navItemStyle}>⚙️ Settings</div>
        </nav>
        <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
      </aside>

      {/* Main Content */}
      <main style={mainContentStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem" }}>System Intelligence</h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Real-time monitoring & predictive analysis</p>
          </div>
          <div style={liveBadgeStyle}>● LIVE</div>
        </header>

        {/* Stats Cards */}
        <section style={statsGridStyle}>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>ACTIVE INCIDENTS</span>
            <div style={statValueStyle}>{incidents.length}</div>
            <div style={{ height: "4px", background: "#38bdf8", width: "40%", marginTop: "10px", borderRadius: "2px" }} />
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>HIGH PRIORITY</span>
            <div style={{ ...statValueStyle, color: "#f43f5e" }}>{highCount}</div>
            <div style={{ height: "4px", background: "#f43f5e", width: "30%", marginTop: "10px", borderRadius: "2px" }} />
          </div>
        </section>

        <div style={dashboardGridStyle}>
          {/* Incident Log */}
          <section style={glassCardStyle}>
            <h3 style={cardTitleStyle}>Recent Activity</h3>
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#475569", fontSize: "0.75rem" }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>ROOT CAUSE</th>
                    <th style={thStyle}>SEVERITY</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident, idx) => (
                    <tr key={idx} style={trStyle}>
                      <td style={tdStyle}>#{incident.id?.slice(0, 8) || idx}</td>
                      <td style={tdStyle}>{incident.root_cause}</td>
                      <td style={tdStyle}>
                        <span style={incident.severity === "HIGH" ? badgeHighStyle : badgeLowStyle}>
                          {incident.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {incidents.length === 0 && (
                    <tr><td colSpan="3" style={emptyTextStyle}>Awaiting system signals...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Distribution Chart */}
          <section style={glassCardStyle}>
            <h3 style={cardTitleStyle}>Traffic Distribution</h3>
            <div style={{ height: "300px", marginTop: "20px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ================= STYLES (PREMIUM DARK THEME) ================= */
const layoutStyle = { display: "flex", height: "100vh", backgroundColor: "#020617", color: "#f8fafc", fontFamily: "'Inter', sans-serif" };
const sidebarStyle = { width: "260px", background: "#0f172a", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: "30px 20px" };
const logoAreaStyle = { fontSize: "1.5rem", fontWeight: "bold", color: "#38bdf8", letterSpacing: "-0.5px" };
const navItemStyle = { padding: "12px 16px", color: "#64748b", cursor: "pointer", borderRadius: "8px", fontSize: "0.95rem", transition: "0.2s" };
const navActiveStyle = { ...navItemStyle, background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", fontWeight: "600" };
const logoutButtonStyle = { padding: "12px", background: "transparent", border: "1px solid #f43f5e", color: "#f43f5e", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginTop: "auto" };

const mainContentStyle = { flex: 1, padding: "40px", overflowY: "auto" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" };
const liveBadgeStyle = { background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "6px 14px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold", border: "1px solid rgba(16, 185, 129, 0.2)" };

const statsGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "25px", marginBottom: "40px" };
const statCardStyle = { background: "#0f172a", padding: "25px", borderRadius: "16px", border: "1px solid #1e293b" };
const statLabelStyle = { fontSize: "0.75rem", color: "#64748b", fontWeight: "800", letterSpacing: "1px" };
const statValueStyle = { fontSize: "2.5rem", fontWeight: "bold", marginTop: "10px" };

const dashboardGridStyle = { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "25px" };
const glassCardStyle = { background: "#0f172a", padding: "25px", borderRadius: "16px", border: "1px solid #1e293b" };
const cardTitleStyle = { margin: 0, fontSize: "1.1rem", fontWeight: "600", color: "#f8fafc" };

const tableContainerStyle = { marginTop: "20px", maxHeight: "400px", overflowY: "auto" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { padding: "12px 8px", borderBottom: "1px solid #1e293b" };
const tdStyle = { padding: "16px 8px", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "0.85rem", color: "#94a3b8" };
const trStyle = { transition: "background 0.2s" };

const badgeLowStyle = { padding: "4px 10px", borderRadius: "6px", background: "#1e293b", color: "#94a3b8", fontSize: "0.7rem", fontWeight: "bold" };
const badgeHighStyle = { ...badgeLowStyle, background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e" };
const emptyTextStyle = { textAlign: "center", padding: "40px", color: "#475569", fontStyle: "italic" };