import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCreator, createCreator, updateCreator, getDomains, getPlatforms, getAdFormats,
  getCreatorPlatforms, createCreatorPlatform, deleteCreatorPlatform,
  getCreatorDomains, createCreatorDomain, deleteCreatorDomain,
  getCreatorCharges, createCreatorCharge, deleteCreatorCharge,
  getCreatorDocuments, uploadCreatorDocument, verifyCreatorDocument, deleteCreatorDocument,
  getMediaKits, createMediaKit, updateMediaKit, getMediaKitLinks, createMediaKitLink, deleteMediaKitLink,
} from "../../api/endpoints";
import { inputStyle, labelStyle, fieldStyle, rowStyle, row3Style, sectionStyle, sectionTitle, btnPrimary, btnSecondary, errorStyle } from "../../components/ui/formStyles";
import ActivityFeed from "../../components/ui/ActivityFeed";
import TagManager from "../../components/ui/TagManager";

const emptyCreator = { name: "", email: "", phone: "", age: "", gender: "", language: "", bio: "" };
const cardStyle = { background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 };
const btnDanger = { padding: "6px 12px", background: "#e57373", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const badge = (color, text) => <span style={{ fontSize: 11, background: color, color: "#fff", padding: "2px 8px", borderRadius: 10, marginLeft: 8 }}>{text}</span>;

export default function CreatorForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...emptyCreator });
  const [domains, setDomains] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [charges, setCharges] = useState([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("form");

  const { data: creator } = useQuery({ queryKey: ["creator", id], queryFn: () => getCreator(id).then((r) => r.data), enabled: isEdit });
  const { data: domainOptions } = useQuery({ queryKey: ["domains"], queryFn: () => getDomains().then((r) => r.data) });
  const { data: platformOptions } = useQuery({ queryKey: ["platforms"], queryFn: () => getPlatforms().then((r) => r.data) });
  const { data: adFormatOptions } = useQuery({ queryKey: ["adFormats"], queryFn: () => getAdFormats().then((r) => r.data) });

  // Detail-page queries (edit mode only)
  const { data: docs } = useQuery({ queryKey: ["creatorDocs", id], queryFn: () => getCreatorDocuments(id).then((r) => r.data), enabled: isEdit && tab === "documents" });
  const { data: mediaKits } = useQuery({ queryKey: ["mediaKits", id], queryFn: () => getMediaKits(id).then((r) => r.data), enabled: isEdit && tab === "mediakit" });

  const verifyDoc = useMutation({ mutationFn: (docId) => verifyCreatorDocument(id, docId), onSuccess: () => qc.invalidateQueries({ queryKey: ["creatorDocs", id] }) });
  const delDoc = useMutation({ mutationFn: (docId) => deleteCreatorDocument(id, docId), onSuccess: () => qc.invalidateQueries({ queryKey: ["creatorDocs", id] }) });

  const docList = docs?.results || docs || [];
  const mkList = mediaKits?.results || mediaKits || [];

  useEffect(() => {
    if (creator) {
      setForm({
        name: creator.name || "", email: creator.email || "", phone: creator.phone || "",
        age: creator.age || "", gender: creator.gender || "",
        language: Array.isArray(creator.language) ? creator.language.join(", ") : creator.language || "",
        bio: creator.bio || "",
      });
      if (creator.domains) setDomains(creator.domains.map((d) => ({ _id: d.id, domain: d.domain, is_primary: d.is_primary })));
      if (creator.platforms) setPlatforms(creator.platforms.map((p) => ({ _id: p.id, platform: p.platform, handle: p.handle, follower_count: p.follower_count || 0, profile_url: p.profile_url || "", is_primary: p.is_primary })));
      if (creator.charges) setCharges(creator.charges.map((c) => ({ _id: c.id, platform: c.platform, ad_format: c.ad_format, charge_amount: c.charge_amount || "", currency: c.currency || "INR", is_negotiable: c.is_negotiable })));
    }
  }, [creator]);

  const syncSubResources = async (creatorId) => {
    if (isEdit) {
      try { const existing = (await getCreatorPlatforms(creatorId)).data; const list = existing?.results || existing || []; for (const p of list) await deleteCreatorPlatform(creatorId, p.id); } catch {}
    }
    for (const p of platforms) {
      if (p.platform) await createCreatorPlatform(creatorId, { platform: p.platform, handle: p.handle, follower_count: p.follower_count || 0, profile_url: p.profile_url || "", is_primary: p.is_primary || false });
    }
    if (isEdit) {
      try { const existing = (await getCreatorDomains(creatorId)).data; const list = existing?.results || existing || []; for (const d of list) await deleteCreatorDomain(creatorId, d.id); } catch {}
    }
    for (const d of domains) {
      if (d.domain) await createCreatorDomain(creatorId, { domain: d.domain, is_primary: d.is_primary || false });
    }
    if (isEdit) {
      try { const existing = (await getCreatorCharges(creatorId)).data; const list = existing?.results || existing || []; for (const c of list) await deleteCreatorCharge(creatorId, c.id); } catch {}
    }
    for (const c of charges) {
      if (c.platform && c.ad_format) await createCreatorCharge(creatorId, { platform: c.platform, ad_format: c.ad_format, charge_amount: c.charge_amount || 0, currency: c.currency || "INR", is_negotiable: c.is_negotiable || false });
    }
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = isEdit ? await updateCreator(id, data) : await createCreator(data);
      const creatorId = res.data.id || id;
      await syncSubResources(creatorId);
      return res;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["creators"] }); qc.invalidateQueries({ queryKey: ["creator"] }); navigate("/creators"); },
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
    if (payload.language) payload.language = payload.language.split(",").map((l) => l.trim()).filter(Boolean);
    else payload.language = [];
    if (!payload.age) delete payload.age;
    mutation.mutate(payload);
  };

  const domainList = domainOptions?.results || domainOptions || [];
  const platformList = platformOptions?.results || platformOptions || [];
  const adFormatList = adFormatOptions?.results || adFormatOptions || [];

  const addDomain = () => setDomains((d) => [...d, { domain: "", is_primary: false }]);
  const updateDomainEntry = (i, k, v) => setDomains((d) => { const n = [...d]; n[i] = { ...n[i], [k]: v }; return n; });
  const removeDomain = (i) => setDomains((d) => d.filter((_, j) => j !== i));

  const addPlatform = () => setPlatforms((p) => [...p, { platform: "", handle: "", follower_count: 0, profile_url: "", is_primary: false }]);
  const updatePlatformEntry = (i, k, v) => setPlatforms((p) => { const n = [...p]; n[i] = { ...n[i], [k]: v }; return n; });
  const removePlatform = (i) => setPlatforms((p) => p.filter((_, j) => j !== i));

  const addCharge = () => setCharges((c) => [...c, { platform: "", ad_format: "", charge_amount: "", currency: "INR", is_negotiable: false }]);
  const updateChargeEntry = (i, k, v) => setCharges((c) => { const n = [...c]; n[i] = { ...n[i], [k]: v }; return n; });
  const removeCharge = (i) => setCharges((c) => c.filter((_, j) => j !== i));

  const getFormatsForPlatform = (platformId) => platformId ? adFormatList.filter((f) => String(f.platform) === String(platformId)) : adFormatList;

  const editTabs = ["form", "kyc", "documents", "mediakit", "tags", "activity"];
  const tabLabel = (t) => t === "form" ? "Details" : t === "mediakit" ? "Media Kit" : t.charAt(0).toUpperCase() + t.slice(1);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate("/creators")} style={btnSecondary}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 24 }}>{isEdit ? (creator?.name || "Edit Creator") : "Add New Creator"}</h1>
      </div>

      {isEdit && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {editTabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, background: tab === t ? "#4fc3f7" : "#eee", color: tab === t ? "#fff" : "#333" }}>{tabLabel(t)}</button>
          ))}
        </div>
      )}

      {error && <div style={errorStyle}>{error}</div>}

      {/* === FORM TAB (always shown in create, default tab in edit) === */}
      {(tab === "form" || !isEdit) && (
        <form onSubmit={handleSubmit}>
          <div style={sectionStyle}>
            <h3 style={sectionTitle}>Personal Information</h3>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required style={inputStyle} />
              </div>
            </div>
            <div style={row3Style}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Phone</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Age</label>
                <input type="number" value={form.age} onChange={(e) => set("age", e.target.value)} style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Gender</label>
                <select value={form.gender} onChange={(e) => set("gender", e.target.value)} style={inputStyle}>
                  <option value="">-- Select --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non_binary">Non-Binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Languages (comma-separated)</label>
              <input value={form.language} onChange={(e) => set("language", e.target.value)} style={inputStyle} placeholder="English, Hindi, Spanish..." />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Bio</label>
              <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Short bio..." />
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ ...sectionTitle, margin: 0 }}>Content Domains</h3>
              <button type="button" onClick={addDomain} style={{ ...btnPrimary, padding: "6px 14px", fontSize: 12 }}>+ Add Domain</button>
            </div>
            {domains.length === 0 && <p style={{ color: "#aaa", fontSize: 13 }}>No domains added. You can skip this or add later.</p>}
            {domains.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                <select value={d.domain} onChange={(e) => updateDomainEntry(i, "domain", e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                  <option value="">-- Select Domain --</option>
                  {domainList.map((dm) => <option key={dm.id} value={dm.id}>{dm.name}</option>)}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap" }}>
                  <input type="checkbox" checked={d.is_primary} onChange={(e) => updateDomainEntry(i, "is_primary", e.target.checked)} /> Primary
                </label>
                <button type="button" onClick={() => removeDomain(i)} style={{ background: "none", border: "none", color: "#e57373", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>×</button>
              </div>
            ))}
          </div>

          <div style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ ...sectionTitle, margin: 0 }}>Social Platforms</h3>
              <button type="button" onClick={addPlatform} style={{ ...btnPrimary, padding: "6px 14px", fontSize: 12 }}>+ Add Platform</button>
            </div>
            {platforms.length === 0 && <p style={{ color: "#aaa", fontSize: 13 }}>No platforms added. You can skip this or add later.</p>}
            {platforms.map((p, i) => (
              <div key={i} style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, marginBottom: 8, position: "relative" }}>
                <button type="button" onClick={() => removePlatform(i)} style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: "#e57373", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>×</button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Platform</label>
                    <select value={p.platform} onChange={(e) => updatePlatformEntry(i, "platform", e.target.value)} style={inputStyle}>
                      <option value="">-- Select --</option>
                      {platformList.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Handle</label>
                    <input value={p.handle} onChange={(e) => updatePlatformEntry(i, "handle", e.target.value)} style={inputStyle} placeholder="@handle" />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Followers</label>
                    <input type="number" value={p.follower_count} onChange={(e) => updatePlatformEntry(i, "follower_count", e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Profile URL</label>
                    <input value={p.profile_url} onChange={(e) => updatePlatformEntry(i, "profile_url", e.target.value)} style={inputStyle} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ ...sectionTitle, margin: 0 }}>Charges (Platform × Ad Format)</h3>
              <button type="button" onClick={addCharge} style={{ ...btnPrimary, padding: "6px 14px", fontSize: 12 }}>+ Add Charge</button>
            </div>
            {charges.length === 0 && <p style={{ color: "#aaa", fontSize: 13 }}>No charges added. You can add pricing per platform and ad format.</p>}
            {charges.map((c, i) => (
              <div key={i} style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, marginBottom: 8, position: "relative" }}>
                <button type="button" onClick={() => removeCharge(i)} style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: "#e57373", fontSize: 18, cursor: "pointer", fontWeight: 700 }}>×</button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Platform</label>
                    <select value={c.platform} onChange={(e) => updateChargeEntry(i, "platform", e.target.value)} style={inputStyle}>
                      <option value="">-- Select --</option>
                      {platformList.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Ad Format</label>
                    <select value={c.ad_format} onChange={(e) => updateChargeEntry(i, "ad_format", e.target.value)} style={inputStyle}>
                      <option value="">-- Select --</option>
                      {getFormatsForPlatform(c.platform).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: 11 }}>Amount (₹)</label>
                    <input type="number" value={c.charge_amount} onChange={(e) => updateChargeEntry(i, "charge_amount", e.target.value)} style={inputStyle} placeholder="0" />
                  </div>
                  <div style={{ paddingBottom: 16 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, whiteSpace: "nowrap" }}>
                      <input type="checkbox" checked={c.is_negotiable} onChange={(e) => updateChargeEntry(i, "is_negotiable", e.target.checked)} /> Negotiable
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => navigate("/creators")} style={btnSecondary}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} style={{ ...btnPrimary, opacity: mutation.isPending ? 0.7 : 1 }}>
              {mutation.isPending ? "Saving..." : isEdit ? "Update Creator" : "Create Creator"}
            </button>
          </div>
        </form>
      )}

      {/* === KYC TAB (edit only) === */}
      {isEdit && tab === "kyc" && creator && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px" }}>KYC Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[["PAN Number", creator.pan_number], ["GST Number", creator.gst_number], ["Aadhaar Number", creator.aadhaar_number], ["Bank Name", creator.bank_name], ["Account No", creator.bank_account_number], ["IFSC Code", creator.bank_ifsc_code], ["Account Holder", creator.bank_account_holder_name], ["UPI ID", creator.upi_id], ["Address", creator.address], ["City", creator.city], ["State", creator.state], ["Pincode", creator.pincode]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14 }}>{v || "—"}</div></div>
            ))}
          </div>
        </div>
      )}

      {/* === DOCUMENTS TAB (edit only) === */}
      {isEdit && tab === "documents" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Documents ({docList.length})</h3>
          </div>
          {docList.length === 0 && <p style={{ color: "#999" }}>No documents uploaded</p>}
          {docList.map((d) => (
            <div key={d.id} style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{d.document_type}</strong>
                {badge(d.verification_status === "verified" ? "#4caf50" : d.verification_status === "rejected" ? "#e57373" : "#ff9800", d.verification_status)}
                {d.file && <a href={d.file} target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: 12, color: "#4fc3f7" }}>View</a>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {d.verification_status === "pending" && <button onClick={() => verifyDoc.mutate(d.id)} style={btnPrimary}>Verify</button>}
                <button onClick={() => delDoc.mutate(d.id)} style={btnDanger}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === MEDIA KIT TAB (edit only) === */}
      {isEdit && tab === "mediakit" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px" }}>Media Kit</h3>
          {mkList.length === 0 && <p style={{ color: "#999" }}>No media kit configured</p>}
          {mkList.map((mk) => (
            <div key={mk.id} style={{ padding: 12, background: "#f8f9fa", borderRadius: 6, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{mk.tagline || "Untitled Media Kit"}</div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{mk.about || ""}</div>
              <div style={{ fontSize: 12, color: "#999" }}>
                Theme: {mk.theme_color || "Default"} | Public: {mk.is_public ? "Yes" : "No"} | URL Slug: {mk.custom_url_slug || "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === TAGS TAB (edit only) === */}
      {isEdit && tab === "tags" && <TagManager entityType="creator" entityId={parseInt(id)} />}

      {/* === ACTIVITY TAB (edit only) === */}
      {isEdit && tab === "activity" && <ActivityFeed entityType="creator" entityId={parseInt(id)} />}
    </div>
  );
}
