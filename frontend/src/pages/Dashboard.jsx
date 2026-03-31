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
  const BASE_URL = import.meta.env.VITE_API_URL;

  /* ================= AUTHENTICATION ================= */
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
          toast.error("Authentication failed");
          return;
        }
        localStorage.setItem("token", data.access_token);
        setIsAuth(true);
        toast.success("Systems Online");
      } else {
        toast.success("Account Created. Please Login.");
        setIsLogin(true);
      }
    } catch (err) {
      toast.error("Server connection lost");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    if (socketRef.current) socketRef.current.close();
  };

  /* ================= DATA & WEBSOCKET ================= */
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
      console.error(err);
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const WS_URL = BASE_URL.replace(/^http/, "ws");
    socketRef.current = new WebSocket(`${WS_URL}/ws?token=${token}`);

    socketRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "ALERT") {
        const alert = msg.data;
        toast.error(`ALERT: ${alert.root_cause}`);
        setAlerts((prev) => [alert, ...prev]);
        setIncidents((prev) => {
          if (prev.find((i) => i.id === alert.id)) return prev;
          return [alert, ...prev];
        });
      }
    };
  };

  useEffect(() => {
    if (isAuth) {
      fetchData();
      connectWebSocket();
    }
    return () => socketRef.current?.close();
  }, [isAuth]);

  /* ================= UI CALCULATIONS ================= */
  const total = incidents.length;
  const high = incidents.filter((i) => i?.severity === "HIGH").length;
  const chartData = [
    { name: "Total", value: total, color: "#0ea5e9" },
    { name: "High", value: high, color: "#f43f5e" },
  ];

  /* ================= AUTH VIEW ================= */
  if (!isAuth) {
    return (
      <div style={authContainerStyle}>
        <Toaster />
        <div style={authCardStyle}>
          <h2 style={{ color: "#0ea5e9" }}>⚡ AI Ops Intelligence</h2>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{isLogin ? "Sign in to monitor" : "Register operator"}</p>
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
            <input style={inputStyle} placeholder="Username" onChange={(e) => setUsername(e.target.value)} required />
            <input style={inputStyle} type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" style={primaryButtonStyle}>{isLogin ? "Login" : "Register"}</button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} style={textButtonStyle}>
            {isLogin ? "Create account" : "Back to login"}
          </button>
        </div>
      </div>
    );
  }

  /* ================= DASHBOARD VIEW ================= */
  return (
    <div style={layoutStyle}>
      <Toaster />
      <aside style={sidebarStyle}>
        <div style={logoAreaStyle}> 
          <span style={{ fontSize: "1.2rem" }}>⚡</span>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>AI Ops</h2>
        </div>
        <nav style={{ marginTop: "30px", flex: 1 }}>
          <div style={navItemActiveStyle}>📊 Dashboard</div>
          <div style={navItemStyle}>🚨 Incidents</div>
          <div style={navItemStyle}>⚙️ Settings</div>
        </nav>
        <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
      </aside>

      <main style={mainContentStyle}>
        <header style={headerStyle}>
          <h1>System Intelligence</h1>
          <div style={statusBadgeStyle}>● LIVE MONITORING</div>
        </header>

        <section style={statsGridStyle}>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>TOTAL INCIDENTS</span>
            <div style={statValueStyle}>{total}</div>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>HIGH SEVERITY</span>
            <div style={{ ...statValueStyle, color: "#f43f5e" }}>{high}</div>
          </div>
        </section>

        <div style={dashboardGridStyle}>
          <section style={glassCardStyle}>
            <h3 style={cardTitleStyle}>Incident Log</h3>
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>CAUSE</th>
                    <th style={thStyle}>SEVERITY</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((i) => (
                    <tr key={i.id} style={trStyle}>
                      <td style={tdStyle}>#{i.id}</td>
                      <td style={tdStyle}>{i.root_cause}</td>
                      <td style={tdStyle}>
                        <span style={i.severity === "HIGH" ? badgeDangerStyle : badgeNormalStyle}>
                          {i.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={glassCardStyle}>
            <h3 style={cardTitleStyle}>Distribution</h3>
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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

/* ================= THEME STYLES ================= */
const layoutStyle = { display: "flex", height: "100vh", backgroundColor: "#020617", color: "white", fontFamily: "Inter, sans-serif" };
const authContainerStyle = { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#020617" };
const authCardStyle = { background: "#0f172a", padding: "40px", borderRadius: "12px", border: "1px solid #1e293b", width: "350px", textAlign: "center" };
const inputStyle = { padding: "12px", borderRadius: "6px", border: "1px solid #334155", background: "#1e293b", color: "white" };
const primaryButtonStyle = { padding: "12px", background: "#0ea5e9", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" };
const textButtonStyle = { background: "none", border: "none", color: "#64748b", marginTop: "15px", cursor: "pointer", fontSize: "0.85rem" };

const sidebarStyle = { width: "240px", background: "#0f172a", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", padding: "20px" };
const logoAreaStyle = { display: "flex", alignItems: "center", gap: "10px", paddingBottom: "20px", borderBottom: "1px solid #1e293b" };
const navItemStyle = { padding: "12px", borderRadius: "8px", color: "#94a3b8", cursor: "pointer", fontSize: "0.9rem" };
const navItemActiveStyle = { ...navItemStyle, background: "#1e293b", color: "#38bdf8", fontWeight: "600" };
const logoutButtonStyle = { padding: "10px", background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "6px", cursor: "pointer" };

const mainContentStyle = { flex: 1, padding: "40px", overflowY: "auto" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const statusBadgeStyle = { background: "#064e3b", color: "#34d399", padding: "5px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold" };

const statsGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" };
const statCardStyle = { background: "#0f172a", padding: "20px", borderRadius: "12px", border: "1px solid #1e293b" };
const statLabelStyle = { fontSize: "0.75rem", color: "#64748b", fontWeight: "bold" };
const statValueStyle = { fontSize: "1.8rem", fontWeight: "bold", marginTop: "5px" };

const dashboardGridStyle = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" };
const glassCardStyle = { background: "#0f172a", padding: "25px", borderRadius: "12px", border: "1px solid #1e293b" };
const cardTitleStyle = { margin: "0 0 20px 0", fontSize: "1rem", color: "#94a3b8" };

const tableContainerStyle = { maxHeight: "400px", overflowY: "auto" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: "12px", color: "#475569", fontSize: "11px", borderBottom: "1px solid #1e293b" };
const tdStyle = { padding: "16px 12px", borderBottom: "1px solid rgba(255,255,255,0.02)", fontSize: "13px" };
const trStyle = { transition: "0.2s" };

const badgeNormalStyle = { padding: "4px 10px", borderRadius: "6px", background: "rgba(51, 65, 85, 0.5)", fontSize: "11px" };
const badgeDangerStyle = { ...badgeNormalStyle, background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e" };