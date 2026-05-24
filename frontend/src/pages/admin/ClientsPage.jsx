import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClients, createClient } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";

const columns = [
  { key: "id", label: "ID" },
  { key: "company_name", label: "Company" },
  { key: "slug", label: "Slug" },
  { key: "email", label: "Email" },
  { key: "is_active", label: "Active", render: (r) => <span style={{ color: r.is_active ? "#81c784" : "#e57373", fontWeight: 600 }}>{r.is_active ? "Yes" : "No"}</span> },
  { key: "created_at", label: "Created", render: (r) => r.created_at?.slice(0, 10) },
];

const empty = { company_name: "", slug: "", email: "", phone: "" };

export default function ClientsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["clients"], queryFn: () => getClients().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: () => createClient(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setOpen(false); setForm({ ...empty }); },
  });

  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(); };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (isLoading) return <p>Loading...</p>;

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" };
  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };

  return (
    <div>
      <PageHeader title="Clients" action={() => setOpen(true)} actionLabel="+ Add Client" />
      <DataTable columns={columns} data={data?.results || data} />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Client">
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Company Name</label>
          <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} required style={inputStyle} />
          <label style={labelStyle}>Slug (subdomain)</label>
          <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated if empty" style={inputStyle} />
          <label style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required style={inputStyle} />
          <label style={labelStyle}>Phone</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} />
          <button type="submit" disabled={mutation.isPending} style={{ width: "100%", padding: "10px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {mutation.isPending ? "Saving..." : "Create Client"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
