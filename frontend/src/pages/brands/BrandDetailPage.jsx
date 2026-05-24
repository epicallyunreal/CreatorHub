import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrand, getBrandContacts, createBrandContact, updateBrandContact, deleteBrandContact } from "../../api/endpoints";
import ActivityFeed from "../../components/ui/ActivityFeed";
import TagManager from "../../components/ui/TagManager";

const cardStyle = { background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 };
const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };
const btnPrimary = { padding: "8px 16px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 };
const btnDanger = { padding: "6px 12px", background: "#e57373", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };

export default function BrandDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("info");
  const [contactForm, setContactForm] = useState(null);

  const { data: brand } = useQuery({ queryKey: ["brand", id], queryFn: () => getBrand(id).then((r) => r.data) });
  const { data: contacts } = useQuery({ queryKey: ["brandContacts", id], queryFn: () => getBrandContacts(id).then((r) => r.data) });

  const addContact = useMutation({ mutationFn: (d) => createBrandContact(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["brandContacts", id] }); setContactForm(null); } });
  const editContact = useMutation({ mutationFn: ({ cId, d }) => updateBrandContact(id, cId, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["brandContacts", id] }); setContactForm(null); } });
  const delContact = useMutation({ mutationFn: (cId) => deleteBrandContact(id, cId), onSuccess: () => qc.invalidateQueries({ queryKey: ["brandContacts", id] }) });

  const contactList = contacts?.results || contacts || [];
  const tabs = ["info", "contacts", "tags", "activity"];

  if (!brand) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate("/brands")} style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" }}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 24 }}>{brand.name}</h1>
        <button onClick={() => navigate(`/brands/${id}/edit`)} style={btnPrimary}>Edit</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, background: tab === t ? "#4fc3f7" : "#eee", color: tab === t ? "#fff" : "#333" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === "info" && (
        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[["Email", brand.contact_email], ["Phone", brand.contact_phone], ["Location", brand.location], ["Country", brand.country], ["Industry", brand.industry], ["Website", brand.website], ["Budget Range", brand.budget_range_min || brand.budget_range_max ? `₹${brand.budget_range_min || 0} – ₹${brand.budget_range_max || "∞"}` : "—"]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14 }}>{v || "—"}</div></div>
            ))}
          </div>
          {brand.description && <div style={{ marginTop: 16 }}><div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>Description</div><div style={{ fontSize: 14 }}>{brand.description}</div></div>}
        </div>
      )}

      {tab === "contacts" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Contacts ({contactList.length})</h3>
            <button onClick={() => setContactForm({ name: "", email: "", phone: "", designation: "", is_primary: false })} style={btnPrimary}>+ Add Contact</button>
          </div>
          {contactForm && (
            <div style={{ padding: 16, background: "#f8f9fa", borderRadius: 6, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Name" style={inputStyle} />
                <input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="Email" style={inputStyle} />
                <input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="Phone" style={inputStyle} />
                <input value={contactForm.designation} onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })} placeholder="Designation" style={inputStyle} />
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <label><input type="checkbox" checked={contactForm.is_primary} onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })} /> Primary Contact</label>
                <div style={{ flex: 1 }} />
                <button onClick={() => setContactForm(null)} style={{ padding: "6px 12px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" }}>Cancel</button>
                <button onClick={() => contactForm.id ? editContact.mutate({ cId: contactForm.id, d: contactForm }) : addContact.mutate(contactForm)} style={btnPrimary}>Save</button>
              </div>
            </div>
          )}
          {contactList.map((c) => (
            <div key={c.id} style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{c.name}</strong>{c.is_primary && <span style={{ marginLeft: 8, fontSize: 11, background: "#4fc3f7", color: "#fff", padding: "2px 6px", borderRadius: 4 }}>Primary</span>}
                <div style={{ fontSize: 13, color: "#666" }}>{c.designation} · {c.email} · {c.phone}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setContactForm(c)} style={{ padding: "6px 12px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Edit</button>
                <button onClick={() => delContact.mutate(c.id)} style={btnDanger}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "tags" && <TagManager entityType="brand" entityId={parseInt(id)} />}
      {tab === "activity" && <ActivityFeed entityType="brand" entityId={parseInt(id)} />}
    </div>
  );
}
