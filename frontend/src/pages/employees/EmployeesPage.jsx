import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEmployees } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";

const columns = [
  { key: "id", label: "ID" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "designation", label: "Designation" },
  { key: "role_name", label: "Role" },
  { key: "is_active", label: "Active", render: (r) => <span style={{ color: r.is_active ? "#81c784" : "#e57373", fontWeight: 600 }}>{r.is_active ? "Yes" : "No"}</span> },
];

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["employees"], queryFn: () => getEmployees().then((r) => r.data) });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Employees" action={() => navigate("/employees/new")} actionLabel="+ Add Employee" />
      <DataTable columns={columns} data={data?.results || data} onEdit={(row) => navigate(`/employees/${row.id}/edit`)} />
    </div>
  );
}
