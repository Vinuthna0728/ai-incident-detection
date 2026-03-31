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

  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const socketRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_API_URL;

  /* ================= AUTH UI ================= */
  if (!isAuth) {
    return (
      <div style={authStyles.container}>
        <div style={authStyles.card}>
          <h2>{isLogin ? "Login" : "Register"}</h2>

          <input
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={async () => {
              try {
                const url = isLogin ? "/login" : "/register";

                const res = await fetch(`${BASE_URL}${url}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ username, password }),
                });

                const data = await res.json();

                if (isLogin) {
                  if (!data.access_token) {
                    alert("Login failed");
                    return;
                  }

                  localStorage.setItem("token", data.access_token);
                  setIsAuth(true);
                } else {
                  alert("Registered! Now login");
                  setIsLogin(true);
                }
              } catch {
                alert("Error");
              }
            }}
          >
            {isLogin ? "Login" : "Register"}
          </button>

          {/* DEMO BUTTON */}
          <button
            onClick={() => {
              setUsername("admin");
              setPassword("admin123");
            }}
          >
            Use Demo Account
          </button>

          <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer" }}>
            {isLogin ? "Create account" : "Already have account?"}
          </p>
        </div>
      </div>
    );
  }

  /* ================= DASHBOARD ================= */

  useEffect(() => {
    fetchData();
    connectWebSocket();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

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
      console.error(err);
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem("token");
    const WS_URL = BASE_URL.replace(/^http/, "ws");

    socketRef.current = new WebSocket(`${WS_URL}/ws?token=${token}`);

    socketRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "ALERT") {
        const alert = msg.data;

        toast.success(`${alert.severity}: ${alert.root_cause}`);

        setAlerts((prev) => [alert, ...prev]);

        setIncidents((prev) => {
          if (prev.find((i) => i.id === alert.id)) return prev;
          return [alert, ...prev];
        });
      }
    };

    socketRef.current.onclose = () => {
      setTimeout(connectWebSocket, 2000);
    };
  };

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

  return (
    <div style={layout}>
      <aside style={sidebar}>
        <h2>AI Ops</h2>
        <div>📊 Dashboard</div>
        <div>🚨 Incidents</div>
        <div>📈 Analytics</div>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.reload();
          }}
        >
          Logout
        </button>
      </aside>

      <main style={main}>
        <h1>System Intelligence</h1>

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

        <div style={card}>
          <h3>Incident Log</h3>
          {incidents.map((i) => (
            <div key={i.id}>
              {i.root_cause} - {i.severity}
            </div>
          ))}
        </div>

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

const authStyles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
    color: "white",
  },
  card: {
    background: "#111827",
    padding: 30,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: 300,
  },
};