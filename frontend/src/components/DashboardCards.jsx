export default function DashboardCards({ incidents }) {
  const total = incidents.length;
  const high = incidents.filter(i => i.severity === "High").length;

  return (
    <div style={{ display: "flex", gap: "20px", margin: "20px 0" }}>
      <div style={cardStyle}>
        <h3>Total Incidents</h3>
        <p>{total}</p>
      </div>

      <div style={{ ...cardStyle, background: "#ffcccc" }}>
        <h3>High Severity</h3>
        <p>{high}</p>
      </div>
    </div>
  );
}

const cardStyle = {
  padding: "20px",
  background: "#e0f7fa",
  borderRadius: "10px",
  width: "200px"
};