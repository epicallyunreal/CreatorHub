import { useQuery } from "@tanstack/react-query";
import { getPlatformStats } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

const StatCard = ({ label, value, color }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 24, flex: "1 1 200px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderTop: `3px solid ${color || "#4fc3f7"}` }}>
    <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700 }}>{value ?? "—"}</div>
  </div>
);

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["platformStats"], queryFn: () => getPlatformStats().then((r) => r.data) });

  if (isLoading) return <p>Loading...</p>;

  const d = data || {};
  const entries = Object.entries(d);

  return (
    <div>
      <PageHeader title="Admin Dashboard" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {entries.length > 0 ? (
          entries.map(([key, val]) => (
            <StatCard key={key} label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} value={typeof val === "number" ? val : JSON.stringify(val)} color="#4fc3f7" />
          ))
        ) : (
          <p style={{ color: "#999" }}>No stats available</p>
        )}
      </div>
    </div>
  );
}
