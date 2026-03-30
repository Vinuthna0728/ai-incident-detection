export default function IncidentTable({ incidents }) {
  const getColor = (severity) => {
    if (severity === "High") return "red";
    if (severity === "Medium") return "orange";
    return "green";
  };

  return (
    <table border="1" cellPadding="10" style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Root Cause</th>
          <th>Severity</th>
          <th>Suggestion</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {incidents.map((inc) => (
          <tr key={inc.id}>
            <td>{inc.id}</td>
            <td>{inc.root_cause}</td>
            <td style={{ color: getColor(inc.severity) }}>
              {inc.severity}
            </td>
            <td>{inc.suggestion}</td>
            <td>{inc.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}