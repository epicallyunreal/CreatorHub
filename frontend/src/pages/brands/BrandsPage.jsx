import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getBrands } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "business_type_name", label: "Business Type" },
  { key: "industry", label: "Industry" },
  { key: "contact_email", label: "Email" },
  { key: "location", label: "Location" },
  { key: "is_active", label: "Status", render: (r) => <span style={{ color: r.is_active ? "#81c784" : "#e57373", fontWeight: 600 }}>{r.is_active ? "Active" : "Inactive"}</span> },
  { key: "created_at", label: "Created", render: (r) => r.created_at?.slice(0, 10) },
];

export default function BrandsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["brands"], queryFn: () => getBrands().then((r) => r.data) });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Brands" action={() => navigate("/brands/new")} actionLabel="+ Add Brand" />
      <DataTable columns={columns} data={data?.results || data} onRowClick={(row) => navigate(`/brands/${row.id}/edit`)} onEdit={(row) => navigate(`/brands/${row.id}/edit`)} />
    </div>
  );
}
