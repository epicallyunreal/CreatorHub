import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

const NAV = [
  { path: "/admin", label: "Dashboard", exact: true },
  { path: "/admin/clients", label: "Clients" },
  { path: "/admin/plans", label: "Plans" },
];

export default function AdminLayout() {
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, background: "#0d1b2a", color: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #333", fontWeight: "bold", fontSize: 18 }}>CollabIQ Admin</div>
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map((n) => {
            const active = n.exact ? location.pathname === n.path : location.pathname.startsWith(n.path);
            return <Link key={n.path} to={n.path} style={{ display: "block", padding: "10px 16px", color: active ? "#4fc3f7" : "#ccc", textDecoration: "none", background: active ? "rgba(79,195,247,0.1)" : "transparent" }}>{n.label}</Link>;
          })}
        </nav>
        <div style={{ padding: 16, borderTop: "1px solid #333" }}>
          <button onClick={() => { logout(); navigate("/login"); }} style={{ width: "100%", padding: 8, background: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, background: "#f5f6fa", overflow: "auto" }}>
        <div style={{ padding: 24 }}><Outlet /></div>
      </main>
    </div>
  );
}
