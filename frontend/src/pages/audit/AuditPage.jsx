import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";

const columns = [
  { key: "id", label: "ID" },
  { key: "action", label: "Action" },
  { key: "model_name", label: "Model" },
  { key: "object_id", label: "Object ID" },
  { key: "actor_type", label: "Actor Type" },
  { key: "actor_id", label: "Actor ID" },
  { key: "created_at", label: "Timestamp", render: (r) => r.created_at?.slice(0, 16).replace("T", " ") },
];

export default function AuditPage() {
  const { data, isLoading } = useQuery({ queryKey: ["audit"], queryFn: () => getAuditLogs().then((r) => r.data) });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Audit Logs" />
      <DataTable columns={columns} data={data?.results || data} />
    </div>
  );
}
