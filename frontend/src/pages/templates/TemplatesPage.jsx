import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCampaignTemplates, createCampaignTemplate, deleteCampaignTemplate, cloneCampaignFromTemplate, getBriefTemplates, createBriefTemplate, deleteBriefTemplate } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

const cardStyle = { background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 };
const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };
const btnPrimary = { padding: "8px 16px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 };
const btnDanger = { padding: "6px 12px", background: "#e57373", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };

export default function TemplatesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("campaign");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data: cTemplates } = useQuery({ queryKey: ["campaignTemplates"], queryFn: () => getCampaignTemplates().then((r) => r.data) });
  const { data: bTemplates } = useQuery({ queryKey: ["briefTemplates"], queryFn: () => getBriefTemplates().then((r) => r.data) });

  const addCampaignTemplate = useMutation({ mutationFn: (d) => createCampaignTemplate(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaignTemplates"] }); setShowForm(false); setForm({ name: "", description: "" }); } });
  const delCampaignTemplate = useMutation({ mutationFn: (id) => deleteCampaignTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaignTemplates"] }) });
  const cloneCampaign = useMutation({ mutationFn: (id) => cloneCampaignFromTemplate(id, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }) });

  const addBriefTemplate = useMutation({ mutationFn: (d) => createBriefTemplate(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["briefTemplates"] }); setShowForm(false); setForm({ name: "", description: "" }); } });
  const delBriefTemplate = useMutation({ mutationFn: (id) => deleteBriefTemplate(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["briefTemplates"] }) });

  const ctList = cTemplates?.results || cTemplates || [];
  const btList = bTemplates?.results || bTemplates || [];

  return (
    <div>
      <PageHeader title="Templates" actionLabel="+ New Template" onAction={() => setShowForm(true)} />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab("campaign")} style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, background: tab === "campaign" ? "#4fc3f7" : "#eee", color: tab === "campaign" ? "#fff" : "#333" }}>Campaign Templates</button>
        <button onClick={() => setTab("brief")} style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, background: tab === "brief" ? "#4fc3f7" : "#eee", color: tab === "brief" ? "#fff" : "#333" }}>Brief Templates</button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, background: "#f8f9fa" }}>
          <h3 style={{ margin: "0 0 12px" }}>{tab === "campaign" ? "New Campaign Template" : "New Brief Template"}</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Template name" style={inputStyle} />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => tab === "campaign" ? addCampaignTemplate.mutate(form) : addBriefTemplate.mutate(form)} style={btnPrimary}>Create</button>
            </div>
          </div>
        </div>
      )}

      {tab === "campaign" && ctList.map((t) => (
        <div key={t.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><strong style={{ fontSize: 16 }}>{t.name}</strong><div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>{t.description || "No description"}</div></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => cloneCampaign.mutate(t.id)} style={btnPrimary}>Clone → Campaign</button>
              <button onClick={() => delCampaignTemplate.mutate(t.id)} style={btnDanger}>Delete</button>
            </div>
          </div>
        </div>
      ))}

      {tab === "brief" && btList.map((t) => (
        <div key={t.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><strong style={{ fontSize: 16 }}>{t.name}</strong><div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>{t.description || "No description"}</div></div>
            <div><button onClick={() => delBriefTemplate.mutate(t.id)} style={btnDanger}>Delete</button></div>
          </div>
        </div>
      ))}

      {tab === "campaign" && ctList.length === 0 && <p style={{ color: "#999" }}>No campaign templates yet</p>}
      {tab === "brief" && btList.length === 0 && <p style={{ color: "#999" }}>No brief templates yet</p>}
    </div>
  );
}
