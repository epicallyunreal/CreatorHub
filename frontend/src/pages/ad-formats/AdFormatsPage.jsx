import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdFormats, createAdFormat, updateAdFormat, deleteAdFormat, getPlatforms } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";

const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };
const btnPrimary = { padding: "10px 24px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" };

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "platform_name", label: "Platform" },
  { key: "description", label: "Description" },
  { key: "_type", label: "Type", render: (r) => r.is_global ? <span style={{ fontSize: 11, background: "#e3f2fd", color: "#1565c0", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Global</span> : <span style={{ fontSize: 11, background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Custom</span> },
];

export default function AdFormatsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", platform: "", description: "" });

  const { data, isLoading } = useQuery({ queryKey: ["adFormats"], queryFn: () => getAdFormats().then((r) => r.data) });
  const platforms = useQuery({ queryKey: ["platforms"], queryFn: () => getPlatforms().then((r) => r.data) });

  const saveMutation = useMutation({
    mutationFn: (d) => modal?.item?.id ? updateAdFormat(modal.item.id, d) : createAdFormat(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adFormats"] }); setModal(null); },
  });
  const delMutation = useMutation({
    mutationFn: (id) => deleteAdFormat(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adFormats"] }); setModal(null); },
  });

  const openModal = (item) => {
    setForm(item ? { name: item.name, platform: item.platform || "", description: item.description || "", platform_name: item.platform_name || "" } : { name: "", platform: "", description: "", platform_name: "" });
    setModal({ item });
  };

  if (isLoading) return <p>Loading...</p>;

  const platformList = platforms.data?.results || platforms.data || [];

  return (
    <div>
      <PageHeader title="Ad Formats" action={() => openModal(null)} actionLabel="+ Add Ad Format" />
      <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Global ad formats (linked to YouTube, Instagram, WhatsApp) are pre-configured. You can add custom ad formats below.</p>
      <DataTable columns={columns} data={data?.results || data} onRowClick={openModal} />

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.item?.is_global ? "Ad Format (Global)" : modal?.item?.id ? "Edit Ad Format" : "Add Ad Format"}>
        {modal?.item?.is_global ? (
          <div>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Global ad formats are pre-configured and cannot be edited.</p>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Name</label><div style={{ ...inputStyle, background: "#f5f5f5", color: "#333" }}>{form.name}</div></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Platform</label><div style={{ ...inputStyle, background: "#f5f5f5", color: "#333" }}>{form.platform_name || "—"}</div></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Description</label><div style={{ ...inputStyle, background: "#f5f5f5", color: "#333" }}>{form.description || "—"}</div></div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
            <label style={labelStyle}>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
            <label style={labelStyle}>Platform *</label>
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} required style={inputStyle}>
              <option value="">Select platform...</option>
              {platformList.map((p) => <option key={p.id} value={p.id}>{p.name}{p.is_global ? " (Global)" : ""}</option>)}
            </select>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {modal?.item?.id && (
                <button type="button" onClick={() => { if (confirm("Delete this ad format?")) delMutation.mutate(modal.item.id); }} style={{ padding: "10px 16px", background: "#ffebee", color: "#d32f2f", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
              )}
              <button type="submit" disabled={saveMutation.isPending} style={btnPrimary}>{saveMutation.isPending ? "Saving..." : "Save"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
