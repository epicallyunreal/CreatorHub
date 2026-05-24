import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlatforms, getDomains, getBusinessTypes, getAdFormats, createDomain, updateDomain, deleteDomain, createBusinessType, updateBusinessType, deleteBusinessType, getTags, createTag, updateTag, deleteTag } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";

const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };

function CrudSection({ title, queryKey, items, columns, emptyForm, onEdit }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>{title}</h2>
        <button onClick={() => onEdit(null)} style={{ padding: "6px 14px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>+ Add</button>
      </div>
      <DataTable columns={columns} data={items} onEdit={onEdit} />
    </div>
  );
}

export default function ConfigPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // { type: "domain"|"businessType", item: null|{} }

  const platforms = useQuery({ queryKey: ["platforms"], queryFn: () => getPlatforms().then((r) => r.data) });
  const domains = useQuery({ queryKey: ["domains"], queryFn: () => getDomains().then((r) => r.data) });
  const businessTypes = useQuery({ queryKey: ["businessTypes"], queryFn: () => getBusinessTypes().then((r) => r.data) });
  const adFormats = useQuery({ queryKey: ["adFormats"], queryFn: () => getAdFormats().then((r) => r.data) });
  const tags = useQuery({ queryKey: ["tags"], queryFn: () => getTags().then((r) => r.data) });

  const loading = platforms.isLoading || domains.isLoading || businessTypes.isLoading || adFormats.isLoading;

  // Domain CRUD
  const [domainForm, setDomainForm] = useState({ name: "", description: "" });
  const domainMutation = useMutation({
    mutationFn: (data) => modal?.item?.id ? updateDomain(modal.item.id, data) : createDomain(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["domains"] }); setModal(null); },
  });
  const domainDeleteMutation = useMutation({
    mutationFn: (id) => deleteDomain(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["domains"] }); },
  });

  // BusinessType CRUD
  const [btForm, setBtForm] = useState({ name: "", description: "" });
  const btMutation = useMutation({
    mutationFn: (data) => modal?.item?.id ? updateBusinessType(modal.item.id, data) : createBusinessType(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["businessTypes"] }); setModal(null); },
  });
  const btDeleteMutation = useMutation({
    mutationFn: (id) => deleteBusinessType(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["businessTypes"] }); },
  });

  // Tag CRUD
  const [tagForm, setTagForm] = useState({ name: "", color: "#4fc3f7", entity_type: "creator" });
  const tagMutation = useMutation({
    mutationFn: (data) => modal?.item?.id ? updateTag(modal.item.id, data) : createTag(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); setModal(null); },
  });
  const tagDeleteMutation = useMutation({
    mutationFn: (id) => deleteTag(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tags"] }); },
  });

  const openDomainModal = (item) => {
    setDomainForm(item ? { name: item.name, description: item.description || "" } : { name: "", description: "" });
    setModal({ type: "domain", item });
  };

  const openBtModal = (item) => {
    setBtForm(item ? { name: item.name, description: item.description || "" } : { name: "", description: "" });
    setModal({ type: "businessType", item });
  };

  const openTagModal = (item) => {
    setTagForm(item ? { name: item.name, color: item.color || "#4fc3f7", entity_type: item.entity_type || "creator" } : { name: "", color: "#4fc3f7", entity_type: "creator" });
    setModal({ type: "tag", item });
  };

  if (loading) return <p>Loading...</p>;

  const domainCols = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "is_active", label: "Active", render: (r) => r.is_active ? "Yes" : "No" },
  ];

  const btCols = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "is_active", label: "Active", render: (r) => r.is_active ? "Yes" : "No" },
  ];

  return (
    <div>
      <PageHeader title="Configuration" />

      <CrudSection title="Content Domains" queryKey="domains" items={domains.data?.results || domains.data} columns={domainCols} onEdit={openDomainModal} />

      <CrudSection title="Business Types" queryKey="businessTypes" items={businessTypes.data?.results || businessTypes.data} columns={btCols} onEdit={openBtModal} />

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Platforms (Global)</h2>
        <DataTable columns={[{ key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "base_url", label: "URL" }]} data={platforms.data?.results || platforms.data} />
      </div>

      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Ad Formats (Global)</h2>
        <DataTable columns={[{ key: "id", label: "ID" }, { key: "name", label: "Name" }, { key: "platform_name", label: "Platform" }]} data={adFormats.data?.results || adFormats.data} />
      </div>

      <CrudSection title="Tags" queryKey="tags" items={tags.data?.results || tags.data} columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "entity_type", label: "Entity Type" },
        { key: "color", label: "Color", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: "50%", background: r.color, display: "inline-block" }} />{r.color}</span> },
      ]} onEdit={openTagModal} />

      {/* Domain Modal */}
      <Modal isOpen={modal?.type === "domain"} onClose={() => setModal(null)} title={modal?.item?.id ? "Edit Domain" : "Add Domain"}>
        <form onSubmit={(e) => { e.preventDefault(); domainMutation.mutate(domainForm); }}>
          <label style={labelStyle}>Name *</label>
          <input value={domainForm.name} onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })} required style={inputStyle} />
          <label style={labelStyle}>Description</label>
          <textarea value={domainForm.description} onChange={(e) => setDomainForm({ ...domainForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {modal?.item?.id && (
              <button type="button" onClick={() => { if (confirm("Delete this domain?")) { domainDeleteMutation.mutate(modal.item.id); setModal(null); } }} style={{ padding: "10px 16px", background: "#ffebee", color: "#d32f2f", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
            )}
            <button type="submit" disabled={domainMutation.isPending} style={{ padding: "10px 24px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {domainMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* BusinessType Modal */}
      <Modal isOpen={modal?.type === "businessType"} onClose={() => setModal(null)} title={modal?.item?.id ? "Edit Business Type" : "Add Business Type"}>
        <form onSubmit={(e) => { e.preventDefault(); btMutation.mutate(btForm); }}>
          <label style={labelStyle}>Name *</label>
          <input value={btForm.name} onChange={(e) => setBtForm({ ...btForm, name: e.target.value })} required style={inputStyle} />
          <label style={labelStyle}>Description</label>
          <textarea value={btForm.description} onChange={(e) => setBtForm({ ...btForm, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {modal?.item?.id && (
              <button type="button" onClick={() => { if (confirm("Delete this business type?")) { btDeleteMutation.mutate(modal.item.id); setModal(null); } }} style={{ padding: "10px 16px", background: "#ffebee", color: "#d32f2f", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
            )}
            <button type="submit" disabled={btMutation.isPending} style={{ padding: "10px 24px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {btMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Tag Modal */}
      <Modal isOpen={modal?.type === "tag"} onClose={() => setModal(null)} title={modal?.item?.id ? "Edit Tag" : "Add Tag"}>
        <form onSubmit={(e) => { e.preventDefault(); tagMutation.mutate(tagForm); }}>
          <label style={labelStyle}>Name *</label>
          <input value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} required style={inputStyle} />
          <label style={labelStyle}>Entity Type *</label>
          <select value={tagForm.entity_type} onChange={(e) => setTagForm({ ...tagForm, entity_type: e.target.value })} style={inputStyle}>
            <option value="creator">Creator</option>
            <option value="brand">Brand</option>
            <option value="campaign">Campaign</option>
          </select>
          <label style={labelStyle}>Color</label>
          <input type="color" value={tagForm.color} onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })} style={{ ...inputStyle, height: 40, padding: 4 }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {modal?.item?.id && (
              <button type="button" onClick={() => { if (confirm("Delete this tag?")) { tagDeleteMutation.mutate(modal.item.id); setModal(null); } }} style={{ padding: "10px 16px", background: "#ffebee", color: "#d32f2f", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
            )}
            <button type="submit" disabled={tagMutation.isPending} style={{ padding: "10px 24px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {tagMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
