import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

const StatCard = ({ label, value, color }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 24, flex: "1 1 200px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderTop: `3px solid ${color || "#4fc3f7"}` }}>
    <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700 }}>{value ?? "—"}</div>
  </div>
);

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard().then((r) => r.data) });

  if (isLoading) return <p>Loading dashboard...</p>;

  const d = data || {};
  return (
    <div>
      <PageHeader title="Dashboard" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <StatCard label="Total Brands" value={d.brands?.total} color="#4fc3f7" />
        <StatCard label="Total Creators" value={d.creators?.total} color="#81c784" />
        <StatCard label="Total Campaigns" value={d.campaigns?.total} color="#ffb74d" />
        <StatCard label="Active Campaigns" value={d.campaigns?.active} color="#ff8a65" />
        <StatCard label="Completed Campaigns" value={d.campaigns?.completed} color="#a5d6a7" />
        <StatCard label="Total Paid" value={d.payouts?.total_paid != null ? `₹${d.payouts.total_paid}` : "—"} color="#ba68c8" />
        <StatCard label="Total Employees" value={d.employees?.total} color="#4dd0e1" />
      </div>
    </div>
  );
}
