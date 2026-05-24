import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlans, createPlan } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "max_employees", label: "Max Employees" },
  { key: "max_brands", label: "Max Brands" },
  { key: "max_creators", label: "Max Creators" },
  { key: "price_monthly", label: "Price/Month", render: (r) => r.price_monthly != null ? `₹${r.price_monthly}` : "—" },
  { key: "is_active", label: "Active", render: (r) => <span style={{ color: r.is_active ? "#81c784" : "#e57373", fontWeight: 600 }}>{r.is_active ? "Yes" : "No"}</span> },
];

const empty = { name: "", max_employees: "", max_brands: "", max_creators: "", price_monthly: "", is_active: true };

export default function PlansPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["plans"], queryFn: () => getPlans().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: () => createPlan(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); setOpen(false); setForm({ ...empty }); },
  });

  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (isLoading) return <p>Loading...</p>;

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" };
  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };

  return (
    <div>
      <PageHeader title="Plans" action={() => setOpen(true)} actionLabel="+ Add Plan" />
      <DataTable columns={columns} data={data?.results || data} />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Plan">
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required style={inputStyle} />
          <label style={labelStyle}>Max Employees</label>
          <input type="number" value={form.max_employees} onChange={(e) => set("max_employees", e.target.value)} required style={inputStyle} />
          <label style={labelStyle}>Max Brands</label>
          <input type="number" value={form.max_brands} onChange={(e) => set("max_brands", e.target.value)} required style={inputStyle} />
          <label style={labelStyle}>Max Creators</label>
          <input type="number" value={form.max_creators} onChange={(e) => set("max_creators", e.target.value)} required style={inputStyle} />
          <label style={labelStyle}>Price Monthly</label>
          <input type="number" step="0.01" value={form.price_monthly} onChange={(e) => set("price_monthly", e.target.value)} required style={inputStyle} />
          <button type="submit" disabled={mutation.isPending} style={{ width: "100%", padding: "10px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {mutation.isPending ? "Saving..." : "Create Plan"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
