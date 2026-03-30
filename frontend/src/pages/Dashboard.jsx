import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const audioRef = useRef(null);

  const BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://ai-incident-detection.onrender.com";

  // 📡 FETCH INCIDENTS
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

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

  // 🔥 WEBSOCKET
  const connectWebSocket = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const WS_URL = BASE_URL.replace(/^http/, "ws");

    const socket = new WebSocket(`${WS_URL}/ws?token=${token}`);

    socket.onopen = () => {
      console.log("✅ WS Connected");
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "ALERT") {
        const alert = msg.data;

        toast.success(`${alert.severity}: ${alert.root_cause}`);

        setAlerts((prev) => [alert, ...prev]);

        setIncidents((prev) => {
          if (prev.some((i) => i.id === alert.id)) return prev;
          return [alert, ...prev];
        });
      }
    };

    socket.onclose = () => {
      console.log("❌ WS Closed → reconnecting...");
      setTimeout(connectWebSocket, 3000);
    };
  };

  // 🔐 AUTH CHECK
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchData();
    connectWebSocket();
  }, []);

  const total = incidents.length;
  const high = incidents.filter((i) => i.severity === "HIGH").length;

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <h2>Total: {total}</h2>
      <h2>High: {high}</h2>

      <h3>Incidents</h3>
      {incidents.map((i) => (
        <div key={i.id}>
          {i.root_cause} - {i.severity}
        </div>
      ))}

      <h3>Alerts</h3>
      {alerts.map((a, i) => (
        <div key={i}>
          {a.root_cause}
        </div>
      ))}
    </div>
  );
}