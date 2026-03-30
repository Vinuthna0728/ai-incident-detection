import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from "recharts";

export default function Dashboard() {
  /* ---------------- STATE MANAGEMENT ---------------- */
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const audioRef = useRef(null);

  /* ---------------- DATA FETCHING (API) ---------------- */
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/incidents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  /* ---------------- REAL-TIME ENGINE (WEBSOCKET) ---------------- */
  useEffect(() => {
  fetchData();

  let socket = null;
  let reconnectTimer = null;
  let isMounted = true;

  const connectWebSocket = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("⚠️ No token found");
      return;
    }

    socket = new WebSocket(`ws://127.0.0.1:8000/ws?token=${token}`);

    socket.onopen = () => {
      console.log("✅ WebSocket Connected");
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("📩 WS DATA:", msg);

        if (msg.type === "ALERT") {
          const alert = msg.data;

          // 🔔 TOAST POPUP
          toast.custom(
            () => (
              <div className="bg-[#0f172a] text-white px-4 py-3 rounded-xl shadow-lg border border-red-500 w-80">
                <div className="font-bold text-red-400">
                  🚨 {alert.severity}
                </div>
                <div className="text-sm mt-1">{alert.root_cause}</div>
                <div className="text-xs mt-1 text-gray-400">
                  {alert.suggestion}
                </div>
              </div>
            ),
            { duration: 4000 }
          );

          // 🔥 ALERT PANEL
          setAlerts((prev) => [alert, ...prev]);

          // 🔥 INCIDENT TABLE (NO DUPLICATES)
          setIncidents((prev) => {
            if (prev.some((i) => i.id === alert.id)) return prev;
            return [alert, ...prev];
          });

          // 🔊 SOUND (ONLY HIGH)
          if (alert.severity === "HIGH") {
            const audio = new Audio("/alert.mp3");
            audio.play().catch(() => {});
          }
        }
      } catch (err) {
        console.error("❌ WS parse error:", err);
      }
    };

    socket.onclose = () => {
      console.log("❌ WS Disconnected");

      if (isMounted) {
        reconnectTimer = setTimeout(() => {
          console.log("🔁 Reconnecting WebSocket...");
          connectWebSocket();
        }, 3000);
      }
    };

    socket.onerror = (err) => {
      console.error("⚠️ WS Error:", err);
      socket.close();
    };
  };

  connectWebSocket();

  return () => {
    isMounted = false;

    if (socket) {
      socket.close();
    }

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
  };
}, []);
  /* ---------------- COMPUTED VALUES ---------------- */
  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const safeAlerts = Array.isArray(alerts) ? alerts : [];

  const total = safeIncidents.length;
  const high = safeIncidents.filter((i) => i?.severity === "HIGH").length;

  const filteredAlerts = safeAlerts.filter((a) => {
    if (filter === "ALL") return true;
    return a?.severity === filter;
  });

  const chartData = [
    { name: "Total", value: total, color: "#38bdf8" },
    { name: "High", value: high, color: "#f43f5e" }
  ];

  /* ---------------- RENDER UI ---------------- */
  return (
    <div style={layoutContainer}>
      {/* INJECTED GLOBAL CSS */}
      <style>{`
        html, body, #root { 
          margin: 0; padding: 0; width: 100%; height: 100%; 
          background: #020617; overflow: hidden; font-family: 'Inter', sans-serif; 
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
      `}</style>

      {/* --- SIDEBAR NAVIGATION --- */}
      <aside style={sidebar}>
        <div style={logoSection}>
          <div style={logoGlow}></div>
          <h2 style={logoText}>AI Ops</h2>
        </div>
        <nav style={navMenu}>
          <div style={navItemActive}>📊 Dashboard</div>
          <div style={navItem}>🚨 Incidents</div>
          <div style={navItem}>📈 Analytics</div>
          <div style={navItem}>⚙ Settings</div>
        </nav>
      </aside>

      {/* --- MAIN DASHBOARD AREA --- */}
      <main style={mainContent}>
        {/* TOP HEADER */}
        <header style={header}>
          <div>
            <h1 style={mainTitle}>System Intelligence</h1>
            <p style={subTitle}>Real-time monitoring & predictive analysis</p>
          </div>
          <div style={liveBadge}>
            <span style={pulseDot}>●</span> LIVE
          </div>
        </header>

        <div style={dashboardGrid}>
          {/* LEFT COLUMN: KPI STATS & LOG TABLE */}
          <div style={leftCol}>
            <div style={statsRow}>
              <div style={glassCard}>
                <p style={cardLabel}>Active Incidents</p>
                <h2 style={cardValue}>{total}</h2>
                <div style={{ ...accentLine, background: "#38bdf8" }} />
              </div>
              <div style={glassCard}>
                <p style={cardLabel}>High Priority</p>
                <h2 style={{ ...cardValue, color: "#f43f5e" }}>{high}</h2>
                <div style={{ ...accentLine, background: "#f43f5e" }} />
              </div>
            </div>

            <div style={tableCard}>
              <div style={cardHeader}>
                <h3 style={sectionTitle}>Incident Log</h3>
              </div>
              <div style={tableScroll}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Root Cause</th>
                      <th style={thStyle}>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeIncidents.map((i, idx) => (
                      <tr key={i.id || idx} style={trStyle}>
                        <td style={tdStyle}>#{i.id?.toString().slice(0, 6) || "NEW"}</td>
                        <td style={{ ...tdStyle, color: "#cbd5e1" }}>{i.root_cause}</td>
                        <td style={tdStyle}>
                          <span style={i.severity === "HIGH" ? badgeDanger : badgeNormal}>
                            {i.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: VISUALS & LIVE ALERTS */}
          <div style={rightCol}>
            {/* CHART CARD */}
            <div style={glassCard}>
              <h3 style={sectionTitle}>Traffic Distribution</h3>
              <div style={{ height: 220, marginTop: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={45}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ALERTS FEED */}
            <div style={alertBox}>
              <div style={cardHeader}>
                <h3 style={sectionTitle}>🚨 Alerts</h3>
                <select style={selectStyle} onChange={(e) => setFilter(e.target.value)}>
                  <option value="ALL">All</option>
                  <option value="HIGH">High Only</option>
                </select>
              </div>
              <div style={alertScroll}>
                {filteredAlerts.length === 0 ? (
                  <p style={emptyText}>Awaiting system signals...</p>
                ) : (
                  filteredAlerts.map((a, i) => (
                    <div key={i} style={alertItem}>
                      <b style={{ color: "#f43f5e", fontSize: "11px" }}>{a.severity}</b>
                      <p style={{ margin: "4px 0", fontSize: "13px" }}>{a.root_cause}</p>
                      <small style={{ color: "#64748b" }}>{a.suggestion}</small>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------------- STYLING CONSTANTS (INTERNAL) ---------------- */
const layoutContainer = { display: "flex", width: "100vw", height: "100vh", background: "#020617" };
const sidebar = { width: "250px", padding: "40px 24px", background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(10px)", borderRight: "1px solid rgba(255,255,255,0.05)" };
const logoSection = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "50px" };
const logoGlow = { width: "10px", height: "10px", borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 15px #38bdf8" };
const logoText = { fontSize: "22px", fontWeight: "800", color: "#fff", margin: 0 };
const navMenu = { display: "flex", flexDirection: "column", gap: "10px" };
const navItem = { padding: "12px 16px", color: "#64748b", borderRadius: "12px", fontSize: "14px", fontWeight: "600", cursor: "pointer" };
const navItemActive = { ...navItem, background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8" };

const mainContent = { flex: 1, padding: "40px 50px", overflowY: "auto", display: "flex", flexDirection: "column" };
const header = { display: "flex", justifyContent: "space-between", marginBottom: "35px" };
const mainTitle = { fontSize: "32px", fontWeight: "800", color: "#fff", margin: 0 };
const subTitle = { color: "#64748b", fontSize: "16px", marginTop: "4px" };
const liveBadge = { background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "800", border: "1px solid rgba(16, 185, 129, 0.2)" };
const pulseDot = { marginRight: "8px", animation: "pulse 2s infinite" };

const dashboardGrid = { display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "30px", flex: 1 };
const leftCol = { display: "flex", flexDirection: "column", gap: "30px" };
const rightCol = { display: "flex", flexDirection: "column", gap: "30px" };

const statsRow = { display: "flex", gap: "25px" };
const glassCard = { background: "rgba(30, 41, 59, 0.4)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "24px", padding: "25px", position: "relative", overflow: "hidden" };
const cardLabel = { color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" };
const cardValue = { fontSize: "42px", fontWeight: "800", color: "#fff", margin: 0 };
const accentLine = { position: "absolute", bottom: 0, left: 0, width: "100%", height: "4px" };

const tableCard = { ...glassCard, padding: "0", flex: 1 };
const cardHeader = { padding: "20px 25px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" };
const sectionTitle = { fontSize: "18px", fontWeight: "700", color: "#fff", margin: 0 };

const tableScroll = { maxHeight: "400px", overflowY: "auto", padding: "10px 25px 25px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "12px", color: "#475569", fontSize: "11px", textTransform: "uppercase" };
const tdStyle = { padding: "16px 12px", borderBottom: "1px solid rgba(255,255,255,0.02)", fontSize: "13px", color: "#fff" };
const trStyle = { borderBottom: "1px solid rgba(255,255,255,0.02)" };

const badgeNormal = { padding: "4px 10px", borderRadius: "6px", background: "rgba(51, 65, 85, 0.5)", color: "#94a3b8", fontSize: "11px", fontWeight: "700" };
const badgeDanger = { ...badgeNormal, background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", border: "1px solid rgba(244, 63, 94, 0.2)" };

const selectStyle = { background: "#1e293b", color: "#fff", border: "1px solid #334155", borderRadius: "8px", padding: "4px 8px", fontSize: "12px" };
const alertBox = { ...glassCard, padding: "0", flex: 1 };
const alertScroll = { maxHeight: "350px", overflowY: "auto", padding: "20px" };
const alertItem = { padding: "15px", marginBottom: "12px", background: "rgba(30, 41, 59, 0.6)", borderLeft: "4px solid #f43f5e", borderRadius: "0 8px 8px 0" };
const emptyText = { textAlign: "center", color: "#475569", marginTop: "20px" };