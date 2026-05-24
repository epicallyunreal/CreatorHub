import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCreator, getCreatorDocuments, uploadCreatorDocument, verifyCreatorDocument, deleteCreatorDocument, getMediaKits, createMediaKit, updateMediaKit, getMediaKitLinks, createMediaKitLink, deleteMediaKitLink } from "../../api/endpoints";
import ActivityFeed from "../../components/ui/ActivityFeed";
import TagManager from "../../components/ui/TagManager";

const cardStyle = { background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 16 };
const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box" };
const btnPrimary = { padding: "8px 16px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 };
const btnDanger = { padding: "6px 12px", background: "#e57373", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const badge = (color, text) => <span style={{ fontSize: 11, background: color, color: "#fff", padding: "2px 8px", borderRadius: 10, marginLeft: 8 }}>{text}</span>;

export default function CreatorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("info");

  const { data: creator } = useQuery({ queryKey: ["creator", id], queryFn: () => getCreator(id).then((r) => r.data) });
  const { data: docs } = useQuery({ queryKey: ["creatorDocs", id], queryFn: () => getCreatorDocuments(id).then((r) => r.data), enabled: tab === "documents" });
  const { data: mediaKits } = useQuery({ queryKey: ["mediaKits", id], queryFn: () => getMediaKits(id).then((r) => r.data), enabled: tab === "mediakit" });

  const verifyDoc = useMutation({ mutationFn: (docId) => verifyCreatorDocument(id, docId), onSuccess: () => qc.invalidateQueries({ queryKey: ["creatorDocs", id] }) });
  const delDoc = useMutation({ mutationFn: (docId) => deleteCreatorDocument(id, docId), onSuccess: () => qc.invalidateQueries({ queryKey: ["creatorDocs", id] }) });

  const docList = docs?.results || docs || [];
  const mkList = mediaKits?.results || mediaKits || [];
  const tabs = ["info", "kyc", "documents", "mediakit", "tags", "activity"];

  if (!creator) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate("/creators")} style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer" }}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 24 }}>{creator.name}</h1>
        <button onClick={() => navigate(`/creators/${id}/edit`)} style={btnPrimary}>Edit</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, background: tab === t ? "#4fc3f7" : "#eee", color: tab === t ? "#fff" : "#333", textTransform: "capitalize" }}>{t === "mediakit" ? "Media Kit" : t}</button>
        ))}
      </div>

      {tab === "info" && (
        <div style={cardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[["Email", creator.email], ["Phone", creator.phone], ["Location", creator.location], ["Genre", creator.genre], ["Languages", creator.languages], ["Instagram Fee", creator.instagram_fee ? `₹${creator.instagram_fee}` : "—"], ["YouTube Fee", creator.youtube_fee ? `₹${creator.youtube_fee}` : "—"]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14 }}>{v || "—"}</div></div>
            ))}
          </div>
        </div>
      )}

      {tab === "kyc" && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 16px" }}>KYC Information</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[["PAN Number", creator.pan_number], ["GST Number", creator.gst_number], ["Aadhaar Number", creator.aadhaar_number], ["Bank Name", creator.bank_name], ["Account No", creator.bank_account_number], ["IFSC Code", creator.bank_ifsc_code], ["Account Holder", creator.bank_account_holder_name], ["UPI ID", creator.upi_id], ["Address", creator.address], ["City", creator.city], ["State", creator.state], ["Pincode", creator.pincode]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14 }}>{v || "—"}</div></div>
            ))}
          </div>
        </div>
      )}

      {tab === "documents" && (
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

      {tab === "mediakit" && (
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

      {tab === "tags" && <TagManager entityType="creator" entityId={parseInt(id)} />}
      {tab === "activity" && <ActivityFeed entityType="creator" entityId={parseInt(id)} />}
    </div>
  );
}
