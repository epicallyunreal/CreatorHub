import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCampaign, createCampaign, updateCampaign, getBrands, transitionCampaign,
  getCampaignBriefs, createCampaignBrief, approveCampaignBrief,
  getDeliverables, createDeliverable, updateDeliverable, deleteDeliverable,
  getCampaignExpenses, createCampaignExpense, deleteCampaignExpense,
  getCampaignDeadlines, createCampaignDeadline, completeCampaignDeadline,
  getNotes, createNote, deleteNote,
} from "../../api/endpoints";
import { inputStyle, labelStyle, fieldStyle, rowStyle, sectionStyle, sectionTitle, btnPrimary, btnSecondary, errorStyle } from "../../components/ui/formStyles";
import TagManager from "../../components/ui/TagManager";

const emptyCampaign = { brand: "", title: "", description: "", objective: "", budget: "", start_date: "", end_date: "" };
const cardStyle = { background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 };
const btnDanger = { padding: "6px 12px", background: "#e57373", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const btnSuccess = { padding: "6px 12px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const badge = (color, text) => <span style={{ fontSize: 11, background: color, color: "#fff", padding: "2px 8px", borderRadius: 10 }}>{text}</span>;

const STAGES = [
  { value: "initiation", label: "Initiation" },
  { value: "requirement_discussion", label: "Requirement Discussion" },
  { value: "creator_discovery", label: "Creator Discovery" },
  { value: "creator_selection", label: "Creator Selection" },
  { value: "agreement", label: "Agreement" },
  { value: "content_creation", label: "Content Creation" },
  { value: "review_approval", label: "Review & Approval" },
  { value: "publishing", label: "Publishing" },
  { value: "performance_tracking", label: "Performance Tracking" },
  { value: "payout_processing", label: "Payout Processing" },
  { value: "campaign_close", label: "Campaign Close" },
];

const CONTEXT_COLORS = {
  note: { bg: "#f0f4f8", border: "#b0bec5", label: "Note", icon: "📝" },
  brand_said: { bg: "#e3f2fd", border: "#42a5f5", label: "Brand", icon: "🏢" },
  creator_said: { bg: "#fce4ec", border: "#ef5350", label: "Creator", icon: "🎨" },
  agency_pitch: { bg: "#e8f5e9", border: "#66bb6a", label: "Agency", icon: "💡" },
};

const emptyBrief = { overview: "", goals: "", target_audience: "", key_messages: "", dos: "", donts: "" };

export default function CampaignForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...emptyCampaign });
  const [error, setError] = useState("");
  const [tab, setTab] = useState("form");
  const [newDeliverable, setNewDeliverable] = useState("");
  const [newExpense, setNewExpense] = useState({ description: "", amount: "" });
  const [newDeadline, setNewDeadline] = useState({ title: "", due_date: "" });
  const [briefForm, setBriefForm] = useState({ ...emptyBrief });
  const [showBriefForm, setShowBriefForm] = useState(false);
  const [threadText, setThreadText] = useState("");
  const [threadContext, setThreadContext] = useState("note");

  const { data: campaign } = useQuery({ queryKey: ["campaign", id], queryFn: () => getCampaign(id).then((r) => r.data), enabled: isEdit });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: () => getBrands().then((r) => r.data) });
  const { data: briefs, refetch: refetchBriefs } = useQuery({ queryKey: ["briefs", id], queryFn: () => getCampaignBriefs(id).then((r) => r.data), enabled: isEdit && tab === "briefs" });
  const { data: deliverables } = useQuery({ queryKey: ["deliverables", id], queryFn: () => getDeliverables(id).then((r) => r.data), enabled: isEdit && tab === "deliverables" });
  const { data: expenses } = useQuery({ queryKey: ["expenses", id], queryFn: () => getCampaignExpenses(id).then((r) => r.data), enabled: isEdit && tab === "expenses" });
  const { data: deadlines } = useQuery({ queryKey: ["deadlines", id], queryFn: () => getCampaignDeadlines(id).then((r) => r.data), enabled: isEdit && tab === "deadlines" });
  const { data: threads } = useQuery({ queryKey: ["threads", id], queryFn: () => getNotes({ entity_type: "campaign", entity_id: id }).then((r) => r.data), enabled: isEdit && tab === "threads" });

  const addDeliverable = useMutation({ mutationFn: (d) => createDeliverable(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["deliverables", id] }); setNewDeliverable(""); } });
  const delDeliverable = useMutation({ mutationFn: (dId) => deleteDeliverable(id, dId), onSuccess: () => qc.invalidateQueries({ queryKey: ["deliverables", id] }) });
  const toggleDeliverable = useMutation({ mutationFn: ({ dId, is_completed }) => updateDeliverable(id, dId, { is_completed }), onSuccess: () => qc.invalidateQueries({ queryKey: ["deliverables", id] }) });
  const addExpense = useMutation({ mutationFn: (d) => createCampaignExpense(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses", id] }); setNewExpense({ description: "", amount: "" }); } });
  const delExpense = useMutation({ mutationFn: (eId) => deleteCampaignExpense(id, eId), onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", id] }) });
  const addDeadline = useMutation({ mutationFn: (d) => createCampaignDeadline(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["deadlines", id] }); setNewDeadline({ title: "", due_date: "" }); } });
  const completeDeadline = useMutation({ mutationFn: (dId) => completeCampaignDeadline(id, dId), onSuccess: () => qc.invalidateQueries({ queryKey: ["deadlines", id] }) });
  const approveBrief = useMutation({ mutationFn: (bId) => approveCampaignBrief(id, bId), onSuccess: () => qc.invalidateQueries({ queryKey: ["briefs", id] }) });
  const saveBrief = useMutation({
    mutationFn: (d) => createCampaignBrief(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["briefs", id] }); setShowBriefForm(false); setBriefForm({ ...emptyBrief }); },
  });
  const doTransition = useMutation({
    mutationFn: (d) => transitionCampaign(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaign", id] }); },
  });
  const addThread = useMutation({
    mutationFn: (d) => createNote(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["threads", id] }); setThreadText(""); },
  });
  const delThread = useMutation({
    mutationFn: (tId) => deleteNote(tId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threads", id] }),
  });

  useEffect(() => {
    if (campaign) {
      setForm({
        brand: campaign.brand || "", title: campaign.title || "", description: campaign.description || "",
        objective: campaign.objective || "", budget: campaign.budget || "",
        start_date: campaign.start_date || "", end_date: campaign.end_date || "",
      });
    }
  }, [campaign]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateCampaign(id, data) : createCampaign(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); navigate("/campaigns"); },
    onError: (err) => {
      const d = err.response?.data;
      setError(typeof d === "object" ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ") : d || "Something went wrong");
    },
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const payload = { ...form };
    if (!payload.budget) delete payload.budget;
    if (!payload.start_date) delete payload.start_date;
    if (!payload.end_date) delete payload.end_date;
    mutation.mutate(payload);
  };

  const brandList = brands?.results || brands || [];
  const briefList = briefs?.results || briefs || [];
  const delList = deliverables?.results || deliverables || [];
  const expList = expenses?.results || expenses || [];
  const dlList = deadlines?.results || deadlines || [];
  const threadList = threads?.results || threads || [];
  const tabs = isEdit ? ["form", "briefs", "deliverables", "expenses", "deadlines", "threads", "tags"] : null;

  const currentStageIdx = campaign ? STAGES.findIndex((s) => s.value === campaign.current_stage) : 0;
  const nextStage = currentStageIdx < STAGES.length - 1 ? STAGES[currentStageIdx + 1] : null;

  /* ── Stage Timeline Sidebar ────────────────────────── */
  const renderTimeline = () => {
    if (!campaign) return null;
    const logs = campaign.status_logs || [];
    const logMap = {};
    logs.forEach((l) => { logMap[l.to_stage] = l; });

    return (
      <div style={{ background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", position: "sticky", top: 20 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#333" }}>Campaign Stage</h3>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
          Status: {badge(campaign.status === "active" ? "#4caf50" : campaign.status === "completed" ? "#2196f3" : "#ff9800", campaign.status)}
        </div>

        <div style={{ position: "relative", paddingLeft: 20 }}>
          {STAGES.map((s, i) => {
            const isCurrent = s.value === campaign.current_stage;
            const isPast = i < currentStageIdx;
            const log = logMap[s.value];
            return (
              <div key={s.value} style={{ position: "relative", paddingBottom: i < STAGES.length - 1 ? 20 : 0, paddingLeft: 16 }}>
                {/* Vertical line */}
                {i < STAGES.length - 1 && (
                  <div style={{ position: "absolute", left: 5, top: 14, bottom: 0, width: 2, background: isPast ? "#4caf50" : isCurrent ? "linear-gradient(#4caf50, #ddd)" : "#e0e0e0" }} />
                )}
                {/* Dot */}
                <div style={{
                  position: "absolute", left: 0, top: 3, width: 12, height: 12, borderRadius: "50%",
                  background: isPast ? "#4caf50" : isCurrent ? "#4fc3f7" : "#e0e0e0",
                  border: isCurrent ? "2px solid #0288d1" : "2px solid transparent",
                  boxShadow: isCurrent ? "0 0 0 3px rgba(79,195,247,0.3)" : "none",
                }} />
                <div style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 400, color: isPast ? "#4caf50" : isCurrent ? "#0288d1" : "#999" }}>
                  {s.label}
                </div>
                {log && (
                  <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                    {log.changed_by_name} · {log.created_at?.slice(0, 10)}
                    {log.notes && <div style={{ fontStyle: "italic", color: "#777" }}>{log.notes}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {nextStage && campaign.status !== "completed" && (
          <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
            <button
              onClick={() => {
                const notes = prompt(`Notes for advancing to "${nextStage.label}":`);
                if (notes !== null) doTransition.mutate({ to_stage: nextStage.value, notes: notes || "" });
              }}
              disabled={doTransition.isPending}
              style={{ ...btnPrimary, width: "100%", fontSize: 13, padding: "8px 12px", background: "#2196f3" }}
            >
              {doTransition.isPending ? "Advancing..." : `Advance → ${nextStage.label}`}
            </button>
            {doTransition.isError && (
              <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 6 }}>{doTransition.error?.response?.data?.detail || "Transition failed"}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ── Main Render ───────────────────────────────────── */
  return (
    <div style={{ maxWidth: isEdit ? 1200 : 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate("/campaigns")} style={btnSecondary}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 24 }}>{isEdit ? "Edit Campaign" : "New Campaign"}</h1>
        {isEdit && campaign && (
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#999" }}>
            {campaign.brand_name} · Created {campaign.created_at?.slice(0, 10)}
          </span>
        )}
      </div>

      {tabs && (
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #eee" }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontWeight: tab === t ? 700 : 400, color: tab === t ? "#4fc3f7" : "#888", borderBottom: tab === t ? "2px solid #4fc3f7" : "2px solid transparent", marginBottom: -2, fontSize: 14, textTransform: "capitalize" }}>
              {t === "form" ? "Details" : t === "threads" ? "Conversations" : t}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: isEdit ? "grid" : "block", gridTemplateColumns: isEdit ? "1fr 280px" : "1fr", gap: 24, alignItems: "start" }}>
        {/* ── Left: Main Content ──────────────────────── */}
        <div>
          {tab === "form" && (
            <>
              {error && <div style={errorStyle}>{error}</div>}
              <form onSubmit={handleSubmit}>
                <div style={sectionStyle}>
                  <h3 style={sectionTitle}>Campaign Details</h3>
                  <div style={rowStyle}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Campaign Title *</label>
                      <input value={form.title} onChange={(e) => set("title", e.target.value)} required style={inputStyle} placeholder="Summer Promo 2026" />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Brand *</label>
                      <select value={form.brand} onChange={(e) => set("brand", e.target.value)} required style={inputStyle}>
                        <option value="">-- Select Brand --</option>
                        {brandList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Description</label>
                    <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Campaign description..." />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Objective</label>
                    <textarea value={form.objective} onChange={(e) => set("objective", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="What are the goals of this campaign?" />
                  </div>
                </div>

                <div style={sectionStyle}>
                  <h3 style={sectionTitle}>Budget & Timeline</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Budget</label>
                      <input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} style={inputStyle} placeholder="0.00" />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Start Date</label>
                      <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} style={inputStyle} />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>End Date</label>
                      <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => navigate("/campaigns")} style={btnSecondary}>Cancel</button>
                  <button type="submit" disabled={mutation.isPending} style={{ ...btnPrimary, opacity: mutation.isPending ? 0.7 : 1 }}>
                    {mutation.isPending ? "Saving..." : isEdit ? "Update Campaign" : "Create Campaign"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Briefs Tab ─────────────────────────────── */}
          {tab === "briefs" && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Campaign Briefs</h3>
                {!showBriefForm && (
                  <button onClick={() => setShowBriefForm(true)} style={btnPrimary}>+ New Brief</button>
                )}
              </div>

              {showBriefForm && (
                <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 16, marginBottom: 16, border: "1px solid #e0e0e0" }}>
                  <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#333" }}>Create Brief</h4>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Overview</label>
                    <textarea value={briefForm.overview} onChange={(e) => setBriefForm({ ...briefForm, overview: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Campaign overview and what the brand wants to achieve..." />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Goals</label>
                    <textarea value={briefForm.goals} onChange={(e) => setBriefForm({ ...briefForm, goals: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Key goals for this campaign..." />
                  </div>
                  <div style={rowStyle}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Target Audience</label>
                      <textarea value={briefForm.target_audience} onChange={(e) => setBriefForm({ ...briefForm, target_audience: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Who should see this content?" />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Key Messages</label>
                      <textarea value={briefForm.key_messages} onChange={(e) => setBriefForm({ ...briefForm, key_messages: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Primary messages to convey..." />
                    </div>
                  </div>
                  <div style={rowStyle}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Do&apos;s</label>
                      <textarea value={briefForm.dos} onChange={(e) => setBriefForm({ ...briefForm, dos: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Things creators should do..." />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Don&apos;ts</label>
                      <textarea value={briefForm.donts} onChange={(e) => setBriefForm({ ...briefForm, donts: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Things creators should avoid..." />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button type="button" onClick={() => { setShowBriefForm(false); setBriefForm({ ...emptyBrief }); }} style={btnSecondary}>Cancel</button>
                    <button
                      type="button"
                      onClick={() => saveBrief.mutate(briefForm)}
                      disabled={saveBrief.isPending}
                      style={{ ...btnPrimary, opacity: saveBrief.isPending ? 0.7 : 1 }}
                    >
                      {saveBrief.isPending ? "Saving..." : "Save Brief"}
                    </button>
                  </div>
                  {saveBrief.isError && (
                    <div style={{ ...errorStyle, marginTop: 8 }}>{saveBrief.error?.response?.data?.detail || saveBrief.error?.response?.data?.campaign?.[0] || "Failed to save brief"}</div>
                  )}
                </div>
              )}

              {briefList.length === 0 && !showBriefForm && <p style={{ color: "#999" }}>No briefs created yet. Click &quot;+ New Brief&quot; to add one.</p>}
              {briefList.map((b) => (
                <div key={b.id} style={{ padding: 16, background: "#f8f9fa", borderRadius: 8, marginBottom: 8, border: "1px solid #eee" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Campaign Brief</div>
                      {b.overview && <p style={{ margin: "0 0 6px", fontSize: 13, color: "#555" }}>{b.overview}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {badge(b.approved ? "#4caf50" : "#ff9800", b.approved ? "Approved" : "Pending")}
                      {!b.approved && <button onClick={() => approveBrief.mutate(b.id)} style={btnSuccess}>Approve</button>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                    {b.goals && <div><strong style={{ color: "#555" }}>Goals:</strong> <span style={{ color: "#666" }}>{b.goals}</span></div>}
                    {b.target_audience && <div><strong style={{ color: "#555" }}>Audience:</strong> <span style={{ color: "#666" }}>{b.target_audience}</span></div>}
                    {b.key_messages && <div><strong style={{ color: "#555" }}>Key Messages:</strong> <span style={{ color: "#666" }}>{b.key_messages}</span></div>}
                    {b.dos && <div><strong style={{ color: "#555" }}>Do&apos;s:</strong> <span style={{ color: "#666" }}>{b.dos}</span></div>}
                    {b.donts && <div><strong style={{ color: "#555" }}>Don&apos;ts:</strong> <span style={{ color: "#666" }}>{b.donts}</span></div>}
                  </div>
                  {b.approved_by && (
                    <div style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
                      Approved by {b.approved_by_name || `Employee #${b.approved_by}`} on {b.approved_at?.slice(0, 10)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Deliverables Tab ───────────────────────── */}
          {tab === "deliverables" && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 16px" }}>Deliverables ({delList.filter(d => d.is_completed).length}/{delList.length})</h3>
              <form onSubmit={(e) => { e.preventDefault(); if (newDeliverable.trim()) addDeliverable.mutate({ title: newDeliverable }); }} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={newDeliverable} onChange={(e) => setNewDeliverable(e.target.value)} placeholder="Add deliverable..." style={{ ...inputStyle, flex: 1 }} />
                <button type="submit" style={btnPrimary}>Add</button>
              </form>
              {delList.map((d) => (
                <div key={d.id} style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={d.is_completed || false} onChange={(e) => toggleDeliverable.mutate({ dId: d.id, is_completed: e.target.checked })} />
                  <span style={{ flex: 1, textDecoration: d.is_completed ? "line-through" : "none", color: d.is_completed ? "#999" : "#333" }}>{d.title}</span>
                  <button onClick={() => delDeliverable.mutate(d.id)} style={btnDanger}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* ── Expenses Tab ───────────────────────────── */}
          {tab === "expenses" && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 16px" }}>Expenses</h3>
              <form onSubmit={(e) => { e.preventDefault(); if (newExpense.description && newExpense.amount) addExpense.mutate(newExpense); }} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="Description" style={{ ...inputStyle, flex: 2 }} />
                <input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="₹ Amount" style={{ ...inputStyle, flex: 1 }} />
                <button type="submit" style={btnPrimary}>Add</button>
              </form>
              {expList.map((e) => (
                <div key={e.id} style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><strong>{e.description}</strong><div style={{ fontSize: 12, color: "#999" }}>{e.category_name || "Uncategorized"} · {e.date}</div></div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>₹{e.amount}</span>
                    <button onClick={() => delExpense.mutate(e.id)} style={btnDanger}>×</button>
                  </div>
                </div>
              ))}
              {expList.length > 0 && (
                <div style={{ marginTop: 12, textAlign: "right", fontWeight: 600, fontSize: 16 }}>
                  Total: ₹{expList.reduce((s, e) => s + parseFloat(e.amount || 0), 0).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* ── Deadlines Tab ──────────────────────────── */}
          {tab === "deadlines" && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 16px" }}>Deadlines</h3>
              <form onSubmit={(e) => { e.preventDefault(); if (newDeadline.title && newDeadline.due_date) addDeadline.mutate(newDeadline); }} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={newDeadline.title} onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })} placeholder="Deadline title" style={{ ...inputStyle, flex: 2 }} />
                <input type="date" value={newDeadline.due_date} onChange={(e) => setNewDeadline({ ...newDeadline, due_date: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                <button type="submit" style={btnPrimary}>Add</button>
              </form>
              {dlList.map((d) => (
                <div key={d.id} style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ textDecoration: d.is_completed ? "line-through" : "none" }}>{d.title}</strong>
                    <div style={{ fontSize: 12, color: "#999" }}>Due: {d.due_date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {badge(d.is_completed ? "#4caf50" : new Date(d.due_date) < new Date() ? "#e57373" : "#ff9800", d.is_completed ? "Done" : new Date(d.due_date) < new Date() ? "Overdue" : "Pending")}
                    {!d.is_completed && <button onClick={() => completeDeadline.mutate(d.id)} style={btnSuccess}>Complete</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Conversations / Threads Tab ────────────── */}
          {tab === "threads" && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 4px" }}>Campaign Conversations</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>Track what the brand said, creator negotiated, and agency pitch notes.</p>

              {/* Compose */}
              <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 14, marginBottom: 20, border: "1px solid #e0e0e0" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {Object.entries(CONTEXT_COLORS).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setThreadContext(key)}
                      style={{
                        padding: "5px 12px", borderRadius: 20, border: threadContext === key ? `2px solid ${cfg.border}` : "1px solid #ddd",
                        background: threadContext === key ? cfg.bg : "#fff", cursor: "pointer", fontSize: 12, fontWeight: threadContext === key ? 700 : 400,
                        color: threadContext === key ? cfg.border : "#888",
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if (threadText.trim()) addThread.mutate({ entity_type: "campaign", entity_id: parseInt(id), text: threadText, context: threadContext }); }} style={{ display: "flex", gap: 8 }}>
                  <textarea
                    value={threadText}
                    onChange={(e) => setThreadText(e.target.value)}
                    placeholder={
                      threadContext === "brand_said" ? "What did the brand communicate?" :
                      threadContext === "creator_said" ? "What did the creator say or negotiate?" :
                      threadContext === "agency_pitch" ? "What does the agency think should be pitched?" :
                      "Add a note..."
                    }
                    rows={2}
                    style={{ ...inputStyle, flex: 1, resize: "vertical" }}
                  />
                  <button type="submit" disabled={addThread.isPending} style={{ ...btnPrimary, alignSelf: "flex-end", padding: "10px 20px" }}>Post</button>
                </form>
              </div>

              {/* Thread list */}
              {threadList.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>No conversations yet. Start by adding a note above.</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {threadList.map((t) => {
                  const cfg = CONTEXT_COLORS[t.context] || CONTEXT_COLORS.note;
                  return (
                    <div key={t.id} style={{ padding: 14, background: cfg.bg, borderRadius: 8, borderLeft: `3px solid ${cfg.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.border, textTransform: "uppercase", letterSpacing: 0.5 }}>{cfg.label}</span>
                          <span style={{ fontSize: 12, color: "#999" }}>· {t.author_name || "Employee"}</span>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#aaa" }}>{t.created_at?.slice(0, 16).replace("T", " ")}</span>
                          <button onClick={() => delThread.mutate(t.id)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, color: "#333", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{t.text}</div>
                      {/* Replies */}
                      {t.replies?.length > 0 && (
                        <div style={{ marginTop: 10, paddingLeft: 16, borderLeft: "2px solid rgba(0,0,0,0.08)" }}>
                          {t.replies.map((r) => {
                            const rcfg = CONTEXT_COLORS[r.context] || CONTEXT_COLORS.note;
                            return (
                              <div key={r.id} style={{ padding: "8px 0", fontSize: 13, color: "#555" }}>
                                <span style={{ fontSize: 12 }}>{rcfg.icon}</span> <strong style={{ color: rcfg.border }}>{r.author_name}</strong>: {r.text}
                                <span style={{ fontSize: 11, color: "#bbb", marginLeft: 8 }}>{r.created_at?.slice(0, 16).replace("T", " ")}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "tags" && <TagManager entityType="campaign" entityId={parseInt(id)} />}
        </div>

        {/* ── Right: Stage Timeline (edit mode only) ── */}
        {isEdit && renderTimeline()}
      </div>
    </div>
  );
}
