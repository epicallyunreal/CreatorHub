import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCampaign, getCampaignBriefs, createCampaignBrief, approveCampaignBrief,
  getDeliverables, createDeliverable, updateDeliverable, deleteDeliverable,
  getCampaignExpenses, createCampaignExpense, deleteCampaignExpense,
  getCampaignDeadlines, createCampaignDeadline, completeCampaignDeadline,
} from "../../api/endpoints";
import ActivityFeed from "../../components/ui/ActivityFeed";
import TagManager from "../../components/ui/TagManager";

const cardStyle = { background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 };
const inputStyle = { padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };
const btnPrimary = { padding: "8px 16px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 };
const btnDanger = { padding: "6px 12px", background: "#e57373", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const btnSuccess = { padding: "6px 12px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const badge = (color, text) => <span style={{ fontSize: 11, background: color, color: "#fff", padding: "2px 8px", borderRadius: 10 }}>{text}</span>;

export default function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("info");
  const [newDeliverable, setNewDeliverable] = useState("");
  const [newExpense, setNewExpense] = useState({ description: "", amount: "" });
  const [newDeadline, setNewDeadline] = useState({ title: "", due_date: "" });

  const { data: campaign } = useQuery({ queryKey: ["campaign", id], queryFn: () => getCampaign(id).then((r) => r.data) });
  const { data: briefs } = useQuery({ queryKey: ["briefs", id], queryFn: () => getCampaignBriefs(id).then((r) => r.data), enabled: tab === "brief" });
  const { data: deliverables } = useQuery({ queryKey: ["deliverables", id], queryFn: () => getDeliverables(id).then((r) => r.data), enabled: tab === "deliverables" });
  const { data: expenses } = useQuery({ queryKey: ["expenses", id], queryFn: () => getCampaignExpenses(id).then((r) => r.data), enabled: tab === "expenses" });
  const { data: deadlines } = useQuery({ queryKey: ["deadlines", id], queryFn: () => getCampaignDeadlines(id).then((r) => r.data), enabled: tab === "deadlines" });

  const addDeliverable = useMutation({ mutationFn: (d) => createDeliverable(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["deliverables", id] }); setNewDeliverable(""); } });
  const delDeliverable = useMutation({ mutationFn: (dId) => deleteDeliverable(id, dId), onSuccess: () => qc.invalidateQueries({ queryKey: ["deliverables", id] }) });
  const toggleDeliverable = useMutation({ mutationFn: ({ dId, is_completed }) => updateDeliverable(id, dId, { is_completed }), onSuccess: () => qc.invalidateQueries({ queryKey: ["deliverables", id] }) });

  const addExpense = useMutation({ mutationFn: (d) => createCampaignExpense(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses", id] }); setNewExpense({ description: "", amount: "" }); } });
  const delExpense = useMutation({ mutationFn: (eId) => deleteCampaignExpense(id, eId), onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", id] }) });

  const addDeadline = useMutation({ mutationFn: (d) => createCampaignDeadline(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["deadlines", id] }); setNewDeadline({ title: "", due_date: "" }); } });
  const completeDeadline = useMutation({ mutationFn: (dId) => completeCampaignDeadline(id, dId), onSuccess: () => qc.invalidateQueries({ queryKey: ["deadlines", id] }) });

  const approveBrief = useMutation({ mutationFn: (bId) => approveCampaignBrief(id, bId), onSuccess: () => qc.invalidateQueries({ queryKey: ["briefs", id] }) });

  const briefList = briefs?.results || briefs || [];
  const delList = deliverables?.results || deliverables || [];
  const expList = expenses?.results || expenses || [];
  const dlList = deadlines?.results || deadlines || [];
  const tabs = ["info", "brief", "deliverables", "expenses", "deadlines", "tags", "activity"];

  if (!campaign) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate("/campaigns")} style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" }}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 24 }}>{campaign.name}</h1>
        {badge(campaign.status === "active" ? "#4caf50" : campaign.status === "completed" ? "#2196f3" : "#ff9800", campaign.status)}
        <button onClick={() => navigate(`/campaigns/${id}/edit`)} style={btnPrimary}>Edit</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, background: tab === t ? "#4fc3f7" : "#eee", color: tab === t ? "#fff" : "#333", textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      {tab === "info" && (
        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[["Brand", campaign.brand_name], ["Status", campaign.status], ["Start Date", campaign.start_date], ["End Date", campaign.end_date], ["Budget", campaign.budget ? `₹${campaign.budget}` : "—"], ["Total Payout", campaign.total_payout ? `₹${campaign.total_payout}` : "—"]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14 }}>{v || "—"}</div></div>
            ))}
          </div>
          {campaign.description && <div style={{ marginTop: 16 }}><div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>Description</div><div style={{ fontSize: 14 }}>{campaign.description}</div></div>}
        </div>
      )}

      {tab === "brief" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px" }}>Campaign Briefs</h3>
          {briefList.length === 0 && <p style={{ color: "#999" }}>No briefs created</p>}
          {briefList.map((b) => (
            <div key={b.id} style={{ padding: 12, background: "#f8f9fa", borderRadius: 6, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.title || "Brief"}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>{b.objective}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {badge(b.is_approved ? "#4caf50" : "#ff9800", b.is_approved ? "Approved" : "Pending")}
                  {!b.is_approved && <button onClick={() => approveBrief.mutate(b.id)} style={btnSuccess}>Approve</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {tab === "tags" && <TagManager entityType="campaign" entityId={parseInt(id)} />}
      {tab === "activity" && <ActivityFeed entityType="campaign" entityId={parseInt(id)} />}
    </div>
  );
}
