import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { onboardClient } from "../../api/endpoints";
import useAuthStore from "../../stores/authStore";

const STEPS = [
  { key: "client", label: "Company Details", required: true },
  { key: "terms", label: "Terms & Conditions", required: true },
  { key: "admin", label: "Admin Account", required: true },
  { key: "brands", label: "Add Brands", required: false },
  { key: "creators", label: "Add Influencers", required: false },
  { key: "review", label: "Review & Launch", required: true },
];

const initialState = {
  company_name: "",
  slug: "",
  email: "",
  phone: "",
  address: "",
  accepted_terms: false,
  admin: { first_name: "", last_name: "", email: "", password: "", designation: "Admin" },
  brands: [],
  creators: [],
};

export default function OnboardingWizard({ onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...initialState, admin: { ...initialState.admin }, brands: [], creators: [] });
  const [error, setError] = useState("");
  const authLogin = useAuthStore((s) => s.login);

  const mutation = useMutation({
    mutationFn: () => onboardClient({
      ...form,
      brands: form.brands.filter((b) => b.name.trim()),
      creators: form.creators.filter((c) => c.name.trim() && c.email.trim()),
    }),
    onSuccess: (res) => {
      authLogin(res.data.access, res.data.refresh);
      onSuccess(res.data);
    },
    onError: (err) => {
      const d = err.response?.data;
      if (typeof d === "object") {
        const msgs = Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
        setError(msgs.join(" | "));
      } else {
        setError(d || "Something went wrong");
      }
    },
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAdmin = (k, v) => setForm((f) => ({ ...f, admin: { ...f.admin, [k]: v } }));

  const canNext = () => {
    if (step === 0) return form.company_name.trim() && form.email.trim();
    if (step === 1) return form.accepted_terms;
    if (step === 2) return form.admin.first_name.trim() && form.admin.email.trim() && form.admin.password.length >= 8;
    return true;
  };

  const next = () => { if (canNext()) { setError(""); setStep((s) => s + 1); } };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const addBrand = () => setForm((f) => ({ ...f, brands: [...f.brands, { name: "", contact_email: "", industry: "", website: "", description: "" }] }));
  const updateBrand = (i, k, v) => setForm((f) => { const b = [...f.brands]; b[i] = { ...b[i], [k]: v }; return { ...f, brands: b }; });
  const removeBrand = (i) => setForm((f) => ({ ...f, brands: f.brands.filter((_, j) => j !== i) }));

  const addCreator = () => setForm((f) => ({ ...f, creators: [...f.creators, { name: "", email: "", phone: "" }] }));
  const updateCreator = (i, k, v) => setForm((f) => { const c = [...f.creators]; c[i] = { ...c[i], [k]: v }; return { ...f, creators: c }; });
  const removeCreator = (i) => setForm((f) => ({ ...f, creators: f.creators.filter((_, j) => j !== i) }));

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 12, fontSize: 14, boxSizing: "border-box" };
  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };
  const rowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>Tell us about your company</h3>
          <label style={labelStyle}>Company Name *</label>
          <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} required style={inputStyle} placeholder="Acme Inc." />
          <label style={labelStyle}>Subdomain (slug)</label>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} style={{ ...inputStyle, marginBottom: 0, borderRadius: "8px 0 0 8px" }} placeholder="acme" />
            <span style={{ padding: "10px 14px", background: "#f0f0f0", border: "1px solid #ddd", borderLeft: "none", borderRadius: "0 8px 8px 0", fontSize: 13, color: "#888", whiteSpace: "nowrap" }}>.collabiq.com</span>
          </div>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Business Email *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required style={inputStyle} placeholder="hello@acme.com" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} placeholder="+1 234 567 890" />
            </div>
          </div>
          <label style={labelStyle}>Address</label>
          <textarea value={form.address} onChange={(e) => set("address", e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} placeholder="123 Business St, City, Country" />
        </div>
      );

      case 1: return (
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>Terms & Conditions</h3>
          <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 8, padding: 20, maxHeight: 300, overflowY: "auto", marginBottom: 16, fontSize: 13, lineHeight: 1.7, color: "#555" }}>
            <p><strong>CollabIQ Terms of Service</strong></p>
            <p>By creating an account, you agree to the following terms:</p>
            <ul>
              <li>Your account data is stored securely and processed in accordance with our Privacy Policy.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You agree not to use the platform for any unlawful purpose.</li>
              <li>CollabIQ reserves the right to suspend accounts that violate these terms.</li>
              <li>Service uptime is provided on a best-effort basis.</li>
            </ul>
            <p><strong>Privacy Policy</strong></p>
            <ul>
              <li>We collect only the data necessary to provide the service.</li>
              <li>Your data will not be sold to third parties.</li>
              <li>You may request data export or deletion at any time.</li>
              <li>Cookies are used for authentication and analytics.</li>
            </ul>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            <input type="checkbox" checked={form.accepted_terms} onChange={(e) => set("accepted_terms", e.target.checked)} style={{ width: 18, height: 18, accentColor: "#4fc3f7" }} />
            I accept the Terms & Conditions and Privacy Policy
          </label>
        </div>
      );

      case 2: return (
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>Create Admin Account</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>This person will be the first admin for your company and can manage everything.</p>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input value={form.admin.first_name} onChange={(e) => setAdmin("first_name", e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input value={form.admin.last_name} onChange={(e) => setAdmin("last_name", e.target.value)} style={inputStyle} />
            </div>
          </div>
          <label style={labelStyle}>Email *</label>
          <input type="email" value={form.admin.email} onChange={(e) => setAdmin("email", e.target.value)} required style={inputStyle} placeholder="admin@acme.com" />
          <label style={labelStyle}>Password * (min 8 characters)</label>
          <input type="password" value={form.admin.password} onChange={(e) => setAdmin("password", e.target.value)} required style={inputStyle} />
          <label style={labelStyle}>Designation</label>
          <input value={form.admin.designation} readOnly disabled style={{ ...inputStyle, background: "#f5f5f5", color: "#999", cursor: "not-allowed" }} />
        </div>
      );

      case 3: return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>Add Your Brands</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>You can skip this and add brands later.</p>
            </div>
            <button type="button" onClick={addBrand} style={{ padding: "8px 16px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add Brand</button>
          </div>
          {form.brands.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 14 }}>No brands added yet. Click "Add Brand" or skip this step.</div>}
          {form.brands.map((b, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 12, position: "relative" }}>
              <button type="button" onClick={() => removeBrand(i)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#e57373", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>×</button>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Brand Name *</label>
                  <input value={b.name} onChange={(e) => updateBrand(i, "name", e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input type="email" value={b.contact_email} onChange={(e) => updateBrand(i, "contact_email", e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>Industry</label>
                  <input value={b.industry} onChange={(e) => updateBrand(i, "industry", e.target.value)} style={inputStyle} placeholder="Fashion, Tech, Food..." />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input value={b.website} onChange={(e) => updateBrand(i, "website", e.target.value)} style={inputStyle} placeholder="https://..." />
                </div>
              </div>
            </div>
          ))}
        </div>
      );

      case 4: return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>Add Influencers / Creators</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>You can skip this and add creators later.</p>
            </div>
            <button type="button" onClick={addCreator} style={{ padding: "8px 16px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add Creator</button>
          </div>
          {form.creators.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 14 }}>No creators added yet. Click "Add Creator" or skip this step.</div>}
          {form.creators.map((c, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 12, position: "relative" }}>
              <button type="button" onClick={() => removeCreator(i)} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "#e57373", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>×</button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input value={c.name} onChange={(e) => updateCreator(i, "name", e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={c.email} onChange={(e) => updateCreator(i, "email", e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={c.phone} onChange={(e) => updateCreator(i, "phone", e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          ))}
        </div>
      );

      case 5: return (
        <div>
          <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>Review & Launch</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Company</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{form.company_name}</div>
              <div style={{ fontSize: 13, color: "#666" }}>{form.slug ? `${form.slug}.collabiq.com` : "(auto-generated slug)"} · {form.email}</div>
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Admin</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{form.admin.first_name} {form.admin.last_name}</div>
              <div style={{ fontSize: 13, color: "#666" }}>{form.admin.email} · {form.admin.designation}</div>
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Brands</div>
              {form.brands.filter((b) => b.name.trim()).length > 0
                ? form.brands.filter((b) => b.name.trim()).map((b, i) => <div key={i} style={{ fontSize: 14, padding: "2px 0" }}>• {b.name} {b.industry ? `(${b.industry})` : ""}</div>)
                : <div style={{ fontSize: 13, color: "#aaa" }}>None — you can add brands later</div>}
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Influencers</div>
              {form.creators.filter((c) => c.name.trim()).length > 0
                ? form.creators.filter((c) => c.name.trim()).map((c, i) => <div key={i} style={{ fontSize: 14, padding: "2px 0" }}>• {c.name} ({c.email})</div>)
                : <div style={{ fontSize: 13, color: "#aaa" }}>None — you can add creators later</div>}
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: 680, maxWidth: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
        {/* Header with progress */}
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Create Your CollabIQ Account</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#aaa", cursor: "pointer" }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: -1 }}>
            {STEPS.map((s, i) => (
              <div key={s.key} style={{ flex: 1, textAlign: "center", paddingBottom: 12, borderBottom: `3px solid ${i <= step ? "#4fc3f7" : "#eee"}`, transition: "border-color 0.2s" }}>
                <span style={{ fontSize: 11, color: i <= step ? "#4fc3f7" : "#bbb", fontWeight: i === step ? 700 : 400 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {error && <div style={{ background: "#fff3f3", color: "#d32f2f", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
          {renderStep()}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between" }}>
          <button type="button" onClick={step === 0 ? onClose : prev} style={{ padding: "10px 24px", background: "#f5f5f5", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600 }}>
            {step === 0 ? "Cancel" : "Back"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {(step === 3 || step === 4) && (
              <button type="button" onClick={next} style={{ padding: "10px 24px", background: "#f5f5f5", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600, color: "#888" }}>
                Skip
              </button>
            )}
            {step < 5 ? (
              <button type="button" onClick={next} disabled={!canNext()} style={{ padding: "10px 24px", background: canNext() ? "#4fc3f7" : "#ccc", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: canNext() ? "pointer" : "not-allowed", fontWeight: 600 }}>
                Next
              </button>
            ) : (
              <button type="button" onClick={() => { setError(""); mutation.mutate(); }} disabled={mutation.isPending} style={{ padding: "10px 28px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600, opacity: mutation.isPending ? 0.7 : 1 }}>
                {mutation.isPending ? "Creating..." : "Launch Your Account 🚀"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
