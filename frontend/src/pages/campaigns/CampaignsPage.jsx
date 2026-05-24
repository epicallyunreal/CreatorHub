import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCampaigns } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";

const stageBadge = (stage) => {
  const colors = { draft: "#90a4ae", active: "#4fc3f7", paused: "#ffb74d", completed: "#81c784", cancelled: "#e57373" };
  return <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: colors[stage] || "#e0e0e0", color: "#fff" }}>{stage}</span>;
};

const columns = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title" },
  { key: "brand_name", label: "Brand" },
  { key: "status", label: "Status", render: (r) => stageBadge(r.status) },
  { key: "current_stage", label: "Stage", render: (r) => r.current_stage?.replace(/_/g, " ") },
  { key: "budget", label: "Budget", render: (r) => r.budget ? `₹${Number(r.budget).toLocaleString()}` : "-" },
  { key: "start_date", label: "Start", render: (r) => r.start_date?.slice(0, 10) || "-" },
  { key: "end_date", label: "End", render: (r) => r.end_date?.slice(0, 10) || "-" },
];

export default function CampaignsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["campaigns"], queryFn: () => getCampaigns().then((r) => r.data) });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Campaigns" action={() => navigate("/campaigns/new")} actionLabel="+ New Campaign" />
      <DataTable columns={columns} data={data?.results || data} onRowClick={(row) => navigate(`/campaigns/${row.id}/edit`)} onEdit={(row) => navigate(`/campaigns/${row.id}/edit`)} />
    </div>
  );
}
