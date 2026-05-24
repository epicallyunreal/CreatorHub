import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlatforms, createPlatform, updatePlatform, deletePlatform } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";

const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };
const btnPrimary = { padding: "10px 24px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" };

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "icon", label: "Icon" },
  { key: "base_url", label: "URL" },
  { key: "_type", label: "Type", render: (r) => r.is_global ? <span style={{ fontSize: 11, background: "#e3f2fd", color: "#1565c0", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Global</span> : <span style={{ fontSize: 11, background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>Custom</span> },
];

export default function PlatformsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", icon: "", base_url: "" });

  const { data, isLoading } = useQuery({ queryKey: ["platforms"], queryFn: () => getPlatforms().then((r) => r.data) });

  const saveMutation = useMutation({
    mutationFn: (d) => modal?.item?.id ? updatePlatform(modal.item.id, d) : createPlatform(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platforms"] }); setModal(null); },
  });
  const delMutation = useMutation({
    mutationFn: (id) => deletePlatform(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platforms"] }); setModal(null); },
  });

  const openModal = (item) => {
    setModal({ item });
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Platforms" action={() => openModal(null)} actionLabel="+ Add Platform" />
      <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Global platforms (YouTube, Instagram, WhatsApp) are pre-configured and cannot be edited. You can add custom platforms below.</p>
      <DataTable columns={columns} data={data?.results || data} onRowClick={openModal} />

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.item?.is_global ? "Platform (Global)" : modal?.item?.id ? "Edit Platform" : "Add Platform"}>
        {modal?.item?.is_global ? (
          <div>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Global platforms are pre-configured and cannot be edited.</p>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Name</label><div style={{ ...inputStyle, background: "#f5f5f5", color: "#333" }}>{form.name}</div></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Icon</label><div style={{ ...inputStyle, background: "#f5f5f5", color: "#333" }}>{form.icon || "—"}</div></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Base URL</label><div style={{ ...inputStyle, background: "#f5f5f5", color: "#333" }}>{form.base_url || "—"}</div></div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
            <label style={labelStyle}>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
            <label style={labelStyle}>Icon</label>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} style={inputStyle} placeholder="e.g. twitter" />
            <label style={labelStyle}>Base URL</label>
            <input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} type="url" style={inputStyle} placeholder="https://..." />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {modal?.item?.id && (
                <button type="button" onClick={() => { if (confirm("Delete this platform?")) delMutation.mutate(modal.item.id); }} style={{ padding: "10px 16px", background: "#ffebee", color: "#d32f2f", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
              )}
              <button type="submit" disabled={saveMutation.isPending} style={btnPrimary}>{saveMutation.isPending ? "Saving..." : "Save"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
