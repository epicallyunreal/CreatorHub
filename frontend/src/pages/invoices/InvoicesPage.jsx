import { useQuery } from "@tanstack/react-query";
import { getInvoices } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";

const columns = [
  { key: "id", label: "ID" },
  { key: "invoice_number", label: "Invoice #" },
  { key: "payout_id", label: "Payout" },
  { key: "amount", label: "Amount", render: (r) => `₹${Number(r.amount || 0).toLocaleString("en-IN")}` },
  { key: "gstin", label: "GSTIN" },
  { key: "place_of_supply", label: "Place of Supply" },
  { key: "status", label: "Status", render: (r) => <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: r.status === "paid" ? "#e8f5e9" : r.status === "sent" ? "#e3f2fd" : "#fff3e0", color: r.status === "paid" ? "#2e7d32" : r.status === "sent" ? "#1565c0" : "#e65100" }}>{r.status || "draft"}</span> },
  { key: "created_at", label: "Created", render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : "" },
];

export default function InvoicesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => getInvoices().then((r) => r.data) });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Invoices" />
      <DataTable columns={columns} data={data?.results || data} />
    </div>
  );
}
