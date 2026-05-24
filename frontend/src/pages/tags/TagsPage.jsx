import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTags, createTag, updateTag, deleteTag } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";

const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };
const btnPrimary = { padding: "10px 24px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" };

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "entity_type", label: "Entity Type", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.entity_type}</span> },
  { key: "color", label: "Color", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: "50%", background: r.color, display: "inline-block" }} />{r.color}</span> },
];

export default function TagsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", color: "#4fc3f7", entity_type: "creator" });

  const { data, isLoading } = useQuery({ queryKey: ["tags"], queryFn: () => getTags().then((r) => r.data) });

  const saveMutation = useMutation({
    mutationFn: (d) => modal?.item?.id ? updateTag(modal.item.id, d) : createTag(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); setModal(null); },
  });
  const delMutation = useMutation({
    mutationFn: (id) => deleteTag(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); setModal(null); },
  });

  const openModal = (item) => {
    setForm(item ? { name: item.name, color: item.color || "#4fc3f7", entity_type: item.entity_type || "creator" } : { name: "", color: "#4fc3f7", entity_type: "creator" });
    setModal({ item });
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Team Tags" action={() => openModal(null)} actionLabel="+ Add Tag" />
      <DataTable columns={columns} data={data?.results || data} onRowClick={openModal} />

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.item?.id ? "Edit Tag" : "Add Tag"}>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
          <label style={labelStyle}>Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
          <label style={labelStyle}>Entity Type *</label>
          <select value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })} style={inputStyle}>
            <option value="creator">Creator</option>
            <option value="brand">Brand</option>
            <option value="campaign">Campaign</option>
          </select>
          <label style={labelStyle}>Color</label>
          <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ ...inputStyle, height: 40, padding: 4 }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {modal?.item?.id && (
              <button type="button" onClick={() => { if (confirm("Delete this tag?")) delMutation.mutate(modal.item.id); }} style={{ padding: "10px 16px", background: "#ffebee", color: "#d32f2f", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
            )}
            <button type="submit" disabled={saveMutation.isPending} style={btnPrimary}>{saveMutation.isPending ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
