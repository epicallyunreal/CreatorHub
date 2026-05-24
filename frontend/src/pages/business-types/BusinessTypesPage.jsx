import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBusinessTypes, createBusinessType, updateBusinessType, deleteBusinessType } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";

const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };
const btnPrimary = { padding: "10px 24px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" };

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "is_active", label: "Active", render: (r) => r.is_active ? "Yes" : "No" },
];

export default function BusinessTypesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data, isLoading } = useQuery({ queryKey: ["businessTypes"], queryFn: () => getBusinessTypes().then((r) => r.data) });

  const saveMutation = useMutation({
    mutationFn: (d) => modal?.item?.id ? updateBusinessType(modal.item.id, d) : createBusinessType(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["businessTypes"] }); setModal(null); },
  });
  const delMutation = useMutation({
    mutationFn: (id) => deleteBusinessType(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["businessTypes"] }); setModal(null); },
  });

  const openModal = (item) => {
    setForm(item ? { name: item.name, description: item.description || "" } : { name: "", description: "" });
    setModal({ item });
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Business Categories" action={() => openModal(null)} actionLabel="+ Add Category" />
      <DataTable columns={columns} data={data?.results || data} onRowClick={openModal} />

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.item?.id ? "Edit Business Category" : "Add Business Category"}>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
          <label style={labelStyle}>Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {modal?.item?.id && (
              <button type="button" onClick={() => { if (confirm("Delete this category?")) delMutation.mutate(modal.item.id); }} style={{ padding: "10px 16px", background: "#ffebee", color: "#d32f2f", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
            )}
            <button type="submit" disabled={saveMutation.isPending} style={btnPrimary}>{saveMutation.isPending ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
