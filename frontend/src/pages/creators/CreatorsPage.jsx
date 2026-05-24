import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCreators } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "gender", label: "Gender" },
  { key: "is_active", label: "Status", render: (r) => <span style={{ color: r.is_active ? "#81c784" : "#e57373", fontWeight: 600 }}>{r.is_active ? "Active" : "Inactive"}</span> },
  { key: "created_at", label: "Created", render: (r) => r.created_at?.slice(0, 10) },
];

export default function CreatorsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["creators"], queryFn: () => getCreators().then((r) => r.data) });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Creators / Influencers" action={() => navigate("/creators/new")} actionLabel="+ Add Creator" />
      <DataTable columns={columns} data={data?.results || data} onRowClick={(row) => navigate(`/creators/${row.id}/edit`)} onEdit={(row) => navigate(`/creators/${row.id}/edit`)} />
    </div>
  );
}
