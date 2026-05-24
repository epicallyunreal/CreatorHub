import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBrand, createBrand, updateBrand, getBusinessTypes, getBrandContacts, createBrandContact, updateBrandContact, deleteBrandContact } from "../../api/endpoints";
import { inputStyle, labelStyle, fieldStyle, rowStyle, sectionStyle, sectionTitle, btnPrimary, btnSecondary, errorStyle } from "../../components/ui/formStyles";
import ActivityFeed from "../../components/ui/ActivityFeed";
import TagManager from "../../components/ui/TagManager";

const empty = { name: "", contact_email: "", contact_phone: "", location: "", country: "", business_type: "", industry: "", website: "", description: "", budget_range_min: "", budget_range_max: "" };
const cardStyle = { background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 };
const btnDanger = { padding: "6px 12px", background: "#e57373", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };

export default function BrandForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState("");
  const [tab, setTab] = useState("form");
  const [contactForm, setContactForm] = useState(null);

  const { data: brand } = useQuery({ queryKey: ["brand", id], queryFn: () => getBrand(id).then((r) => r.data), enabled: isEdit });
  const { data: businessTypes } = useQuery({ queryKey: ["businessTypes"], queryFn: () => getBusinessTypes().then((r) => r.data) });
  const { data: contacts } = useQuery({ queryKey: ["brandContacts", id], queryFn: () => getBrandContacts(id).then((r) => r.data), enabled: isEdit && tab === "contacts" });

  const addContact = useMutation({ mutationFn: (d) => createBrandContact(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["brandContacts", id] }); setContactForm(null); } });
  const editContact = useMutation({ mutationFn: ({ cId, d }) => updateBrandContact(id, cId, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["brandContacts", id] }); setContactForm(null); } });
  const delContact = useMutation({ mutationFn: (cId) => deleteBrandContact(id, cId), onSuccess: () => qc.invalidateQueries({ queryKey: ["brandContacts", id] }) });

  const contactList = contacts?.results || contacts || [];

  useEffect(() => {
    if (brand) {
      setForm({
        name: brand.name || "", contact_email: brand.contact_email || "", contact_phone: brand.contact_phone || "",
        location: brand.location || "", country: brand.country || "", business_type: brand.business_type || "",
        industry: brand.industry || "", website: brand.website || "", description: brand.description || "",
        budget_range_min: brand.budget_range_min || "", budget_range_max: brand.budget_range_max || "",
      });
    }
  }, [brand]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateBrand(id, data) : createBrand(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brands"] }); navigate("/brands"); },
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
    if (!payload.business_type) delete payload.business_type;
    if (!payload.budget_range_min) delete payload.budget_range_min;
    if (!payload.budget_range_max) delete payload.budget_range_max;
    mutation.mutate(payload);
  };

  const btList = businessTypes?.results || businessTypes || [];
  const editTabs = ["form", "contacts", "tags", "activity"];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate("/brands")} style={btnSecondary}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 24 }}>{isEdit ? (brand?.name || "Edit Brand") : "Add New Brand"}</h1>
      </div>

      {isEdit && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {editTabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, background: tab === t ? "#4fc3f7" : "#eee", color: tab === t ? "#fff" : "#333" }}>{t === "form" ? "Details" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      )}

      {error && <div style={errorStyle}>{error}</div>}

      {/* === FORM TAB === */}
      {(tab === "form" || !isEdit) && (
        <form onSubmit={handleSubmit}>
          <div style={sectionStyle}>
            <h3 style={sectionTitle}>Basic Information</h3>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Brand Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required style={inputStyle} placeholder="Acme Corp" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Business Type</label>
                <select value={form.business_type} onChange={(e) => set("business_type", e.target.value)} style={inputStyle}>
                  <option value="">-- Select --</option>
                  {btList.map((bt) => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                </select>
              </div>
            </div>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Industry</label>
                <input value={form.industry} onChange={(e) => set("industry", e.target.value)} style={inputStyle} placeholder="Fashion, Tech, Food..." />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Website</label>
                <input value={form.website} onChange={(e) => set("website", e.target.value)} style={inputStyle} placeholder="https://..." />
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Brief description of the brand..." />
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitle}>Contact Information</h3>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Contact Email *</label>
                <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} required style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Contact Phone</label>
                <input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Location</label>
                <input value={form.location} onChange={(e) => set("location", e.target.value)} style={inputStyle} placeholder="City, State" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Country</label>
                <input value={form.country} onChange={(e) => set("country", e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitle}>Budget Range</h3>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Minimum Budget</label>
                <input type="number" value={form.budget_range_min} onChange={(e) => set("budget_range_min", e.target.value)} style={inputStyle} placeholder="0.00" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Maximum Budget</label>
                <input type="number" value={form.budget_range_max} onChange={(e) => set("budget_range_max", e.target.value)} style={inputStyle} placeholder="0.00" />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => navigate("/brands")} style={btnSecondary}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} style={{ ...btnPrimary, opacity: mutation.isPending ? 0.7 : 1 }}>
              {mutation.isPending ? "Saving..." : isEdit ? "Update Brand" : "Create Brand"}
            </button>
          </div>
        </form>
      )}

      {/* === CONTACTS TAB (edit only) === */}
      {isEdit && tab === "contacts" && (
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

      {/* === TAGS TAB (edit only) === */}
      {isEdit && tab === "tags" && <TagManager entityType="brand" entityId={parseInt(id)} />}

      {/* === ACTIVITY TAB (edit only) === */}
      {isEdit && tab === "activity" && <ActivityFeed entityType="brand" entityId={parseInt(id)} />}
    </div>
  );
}
