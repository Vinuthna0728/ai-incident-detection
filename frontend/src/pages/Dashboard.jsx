import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("ALL");

  const socketRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_API_URL;

  /* ---------------- AUTH + INIT ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchData();
    connectWebSocket();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  /* ---------------- FETCH DATA ---------------- */
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${BASE_URL}/incidents`, {
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

  /* ---------------- WEBSOCKET ---------------- */
  const connectWebSocket = () => {
    const token = localStorage.getItem("token");

    const WS_URL = BASE_URL.replace(/^http/, "ws");

    socketRef.current = new WebSocket(`${WS_URL}/ws?token=${token}`);

    socketRef.current.onopen = () => {
      console.log("✅ WS Connected");
    };

    socketRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "ALERT") {
          const alert = msg.data;

          // 🔔 Toast
          toast.custom(
            () => (
              <div className="bg-[#0f172a] text-white px-4 py-3 rounded-xl border border-red-500 w-80">
                <b style={{ color: "#f43f5e" }}>{alert.severity}</b>
                <div>{alert.root_cause}</div>
                <small>{alert.suggestion}</small>
              </div>
            ),
            { duration: 4000 }
          );

          // Update alerts
          setAlerts((prev) => [alert, ...prev]);

          // Update incidents
          setIncidents((prev) => {
            if (prev.find((i) => i.id === alert.id)) return prev;
            return [alert, ...prev];
          });

          // 🔊 Sound
          if (alert.severity === "HIGH") {
            const audio = new Audio("/alert.mp3");
            audio.play().catch(() => {});
          }
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    };

    socketRef.current.onclose = () => {
      console.log("❌ WS reconnecting...");
      setTimeout(connectWebSocket, 2000);
    };
  };

  /* ---------------- COMPUTED ---------------- */
  const total = incidents.length;
  const high = incidents.filter((i) => i?.severity === "HIGH").length;

  const filteredAlerts =
    filter === "ALL"
      ? alerts
      : alerts.filter((a) => a?.severity === filter);

  const chartData = [
    { name: "Total", value: total, color: "#38bdf8" },
    { name: "High", value: high, color: "#f43f5e" },
  ];

  /* ---------------- UI ---------------- */
  return (
    <div style={layout}>
      <aside style={sidebar}>
        <h2>AI Ops</h2>
        <div>📊 Dashboard</div>
        <div>🚨 Incidents</div>
        <div>📈 Analytics</div>
      </aside>

      <main style={main}>
        <h1>System Intelligence</h1>

        {/* STATS */}
        <div style={{ display: "flex", gap: 20 }}>
          <div style={card}>
            <p>Active</p>
            <h2>{total}</h2>
          </div>
          <div style={card}>
            <p>High</p>
            <h2 style={{ color: "red" }}>{high}</h2>
          </div>
        </div>

        {/* TABLE */}
        <div style={card}>
          <h3>Incident Log</h3>
          {incidents.map((i) => (
            <div key={i.id}>
              {i.root_cause} - {i.severity}
            </div>
          ))}
        </div>

        {/* CHART */}
        <div style={card}>
          <h3>Stats</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="value">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ALERTS */}
        <div style={card}>
          <h3>Alerts</h3>
          <select onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All</option>
            <option value="HIGH">High</option>
          </select>

          {filteredAlerts.map((a, i) => (
            <div key={i}>{a.root_cause}</div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ---------- STYLES ---------- */
const layout = {
  display: "flex",
  minHeight: "100vh",
  background: "#020617",
  color: "white",
};

const sidebar = {
  width: 200,
  padding: 20,
  background: "#0f172a",
};

const main = {
  flex: 1,
  padding: 30,
};

const card = {
  background: "#111827",
  padding: 20,
  marginTop: 20,
  borderRadius: 10,
};