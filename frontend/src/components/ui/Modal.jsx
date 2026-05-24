export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 500, maxWidth: "90vw", maxHeight: "85vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
