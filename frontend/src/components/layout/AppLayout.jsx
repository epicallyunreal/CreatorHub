import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

const NAV = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/brands", label: "Brands" },
  { path: "/creators", label: "Creators" },
  { path: "/campaigns", label: "Campaigns" },
  { path: "/calendar", label: "Calendar" },
  { path: "/payouts", label: "Payouts" },
  { path: "/invoices", label: "Invoices" },
  { path: "/templates", label: "Templates" },
  { divider: true, label: "Configuration" },
  { path: "/platforms", label: "Platforms" },
  { path: "/ad-formats", label: "Ad Formats" },
  { path: "/domains", label: "Domains" },
  { path: "/business-types", label: "Business Types" },
  { path: "/tags", label: "Tags" },
  { divider: true, label: "Administration" },
  { path: "/employees", label: "Employees" },
  { path: "/roles", label: "Roles" },
  { path: "/notifications", label: "Notifications" },
  { path: "/notifications/templates", label: "Notif. Templates" },
  { path: "/reports", label: "Reports" },
  { path: "/audit", label: "Audit Log" },
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, background: "#1a1a2e", color: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #333", fontWeight: "bold", fontSize: 18 }}>CollabIQ</div>
        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {NAV.map((n, i) =>
            n.divider ? (
              <div key={i} style={{ padding: "12px 16px 4px", fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>{n.label}</div>
            ) : (
              <Link key={n.path} to={n.path} style={{ display: "block", padding: "8px 16px", color: location.pathname.startsWith(n.path) && (n.path !== "/notifications" || location.pathname === "/notifications") ? "#4fc3f7" : "#ccc", textDecoration: "none", background: location.pathname.startsWith(n.path) && (n.path !== "/notifications" || location.pathname === "/notifications") ? "rgba(79,195,247,0.1)" : "transparent", fontSize: 13 }}>{n.label}</Link>
            )
          )}
        </nav>
        <div style={{ padding: 16, borderTop: "1px solid #333" }}>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 8 }}>{user?.email || ""}</div>
          <button onClick={() => { logout(); navigate("/login"); }} style={{ width: "100%", padding: 8, background: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, background: "#f5f6fa", overflow: "auto" }}>
        <div style={{ padding: 24 }}><Outlet /></div>
      </main>
    </div>
  );
}
