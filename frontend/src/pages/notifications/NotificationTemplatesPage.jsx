import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotificationTemplates, createNotificationTemplate, updateNotificationTemplate, deleteNotificationTemplate } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";

const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };

const TRIGGER_EVENTS = ["campaign_created", "campaign_updated", "payout_approved", "payout_rejected", "content_submitted", "content_approved", "deadline_approaching", "creator_assigned"];

export default function NotificationTemplatesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", trigger_event: "", title_template: "", body_template: "", is_enabled: true });

  const { data, isLoading } = useQuery({ queryKey: ["notifTemplates"], queryFn: () => getNotificationTemplates().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (d) => modal?.id ? updateNotificationTemplate(modal.id, d) : createNotificationTemplate(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifTemplates"] }); setModal(null); },
  });

  const delMutation = useMutation({
    mutationFn: (id) => deleteNotificationTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifTemplates"] }),
  });

  const openModal = (item) => {
    setForm(item ? { name: item.name, trigger_event: item.trigger_event, title_template: item.title_template, body_template: item.body_template, is_enabled: item.is_enabled } : { name: "", trigger_event: "", title_template: "", body_template: "", is_enabled: true });
    setModal(item || {});
  };

  if (isLoading) return <p>Loading...</p>;
  const items = data?.results || data || [];

  return (
    <div>
      <PageHeader title="Notification Templates" actionLabel="+ New Template" action={() => openModal(null)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.length === 0 && <p style={{ color: "#999", textAlign: "center", padding: 40 }}>No templates configured</p>}
        {items.map((t) => (
          <div key={t.id} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                Trigger: <code style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{t.trigger_event}</code>
                <span style={{ marginLeft: 12, color: t.is_enabled ? "#4caf50" : "#999" }}>{t.is_enabled ? "Enabled" : "Disabled"}</span>
              </div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>Title: {t.title_template}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openModal(t)} style={{ padding: "6px 14px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Edit</button>
              <button onClick={() => delMutation.mutate(t.id)} style={{ padding: "6px 14px", background: "#ffebee", color: "#d32f2f", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit Template" : "New Notification Template"}>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}>
          <label style={labelStyle}>Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
          <label style={labelStyle}>Trigger Event *</label>
          <select value={form.trigger_event} onChange={(e) => setForm({ ...form, trigger_event: e.target.value })} required style={inputStyle}>
            <option value="">-- Select --</option>
            {TRIGGER_EVENTS.map((ev) => <option key={ev} value={ev}>{ev.replace(/_/g, " ")}</option>)}
          </select>
          <label style={labelStyle}>Title Template *</label>
          <input value={form.title_template} onChange={(e) => setForm({ ...form, title_template: e.target.value })} required style={inputStyle} placeholder="e.g. Campaign {{campaign_name}} created" />
          <label style={labelStyle}>Body Template</label>
          <textarea value={form.body_template} onChange={(e) => setForm({ ...form, body_template: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} placeholder="Use {{variable}} for dynamic content" />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} />
            <span style={{ fontSize: 14 }}>Enabled</span>
          </label>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setModal(null)} style={{ padding: "10px 16px", background: "#eee", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} style={{ padding: "10px 24px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {mutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
