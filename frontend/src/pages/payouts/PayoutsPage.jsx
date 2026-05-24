import { useQuery } from "@tanstack/react-query";
import { getPayouts } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";

const statusBadge = (status) => {
  const colors = { pending: "#ffb74d", approved: "#4fc3f7", paid: "#81c784", rejected: "#e57373" };
  return <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: colors[status] || "#e0e0e0", color: "#fff" }}>{status}</span>;
};

const columns = [
  { key: "id", label: "ID" },
  { key: "campaign_creator", label: "Campaign Creator" },
  { key: "amount", label: "Amount", render: (r) => `₹${r.amount}` },
  { key: "tds_amount", label: "TDS", render: (r) => r.tds_amount ? `₹${r.tds_amount}` : "—" },
  { key: "net_payable", label: "Net Payable", render: (r) => r.net_payable ? `₹${r.net_payable}` : "—" },
  { key: "payment_mode", label: "Mode", render: (r) => r.payment_mode || "—" },
  { key: "status", label: "Status", render: (r) => statusBadge(r.status) },
  { key: "due_date", label: "Due Date", render: (r) => r.due_date?.slice(0, 10) },
  { key: "paid_at", label: "Paid At", render: (r) => r.paid_at?.slice(0, 10) || "—" },
];

export default function PayoutsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["payouts"], queryFn: () => getPayouts().then((r) => r.data) });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Payouts" />
      <DataTable columns={columns} data={data?.results || data} />
    </div>
  );
}
