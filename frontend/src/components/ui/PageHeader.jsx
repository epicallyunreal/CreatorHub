export default function PageHeader({ title, action, actionLabel, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {children}
        {action && <button onClick={action} style={{ padding: "8px 16px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>{actionLabel || "+ Add"}</button>}
      </div>
    </div>
  );
}
