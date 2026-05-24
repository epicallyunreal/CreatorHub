export default function DataTable({ columns, data, onRowClick, onEdit }) {
  const allCols = onEdit ? [...columns, { key: "_actions", label: "Actions" }] : columns;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <thead>
        <tr>
          {allCols.map((c) => (
            <th key={c.key} style={{ padding: "12px 16px", textAlign: "left", background: "#f8f9fa", borderBottom: "2px solid #e9ecef", fontSize: 13, fontWeight: 600, color: "#555" }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {!data?.length && <tr><td colSpan={allCols.length} style={{ padding: 24, textAlign: "center", color: "#999" }}>No records found</td></tr>}
        {data?.map((row, i) => (
          <tr key={row.id || i} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? "pointer" : "default", borderBottom: "1px solid #f0f0f0" }}>
            {columns.map((c) => (
              <td key={c.key} style={{ padding: "10px 16px", fontSize: 14 }}>{c.render ? c.render(row) : row[c.key]}</td>
            ))}
            {onEdit && (
              <td style={{ padding: "10px 16px", fontSize: 14 }}>
                <button onClick={(e) => { e.stopPropagation(); onEdit(row); }} style={{ padding: "4px 12px", background: "#e3f2fd", color: "#1976d2", border: "1px solid #bbdefb", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
