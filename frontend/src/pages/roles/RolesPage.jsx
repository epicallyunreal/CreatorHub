import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoles, getRole, createRole, updateRole, deleteRole, getPermissions, assignPermissions } from "../../api/endpoints";
import DataTable from "../../components/ui/DataTable";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "employee_count", label: "Employees" },
  { key: "is_default", label: "Default", render: (r) => r.is_default ? "Yes" : "No" },
];

const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" };
const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" };
const btnPrimary = { padding: "10px 24px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" };

// Mirror of backend MANAGE_IMPLIES — manage permission auto-selects these
const MANAGE_IMPLIES = {
  "brands.manage": ["brands.create", "brands.edit", "brands.void", "brands.view"],
  "creators.manage": ["creators.create", "creators.edit", "creators.void", "creators.view"],
  "campaigns.manage": ["campaigns.create", "campaigns.edit", "campaigns.void", "campaigns.view", "campaigns.transition_stage", "campaigns.assign_creator"],
  "payouts.manage": ["payouts.create", "payouts.edit", "payouts.void", "payouts.view"],
  "reports.manage": ["reports.view", "reports.export"],
  "config.manage": ["config.view", "config.create", "config.edit", "config.void"],
  "domains.manage": ["domains.view", "domains.create", "domains.edit", "domains.void"],
  "business_types.manage": ["business_types.view", "business_types.create", "business_types.edit", "business_types.void"],
  "platforms.manage": ["platforms.view", "platforms.create", "platforms.edit", "platforms.void"],
  "ad_formats.manage": ["ad_formats.view", "ad_formats.create", "ad_formats.edit", "ad_formats.void"],
  "tags.manage": ["tags.view", "tags.create", "tags.edit"],
  "team_tags.manage": ["team_tags.view", "team_tags.create", "team_tags.edit", "team_tags.void"],
  "employees.manage": ["employees.create", "employees.edit", "employees.void", "employees.view", "employees.assign_role", "employees.set_overrides"],
  "roles.manage": ["roles.create", "roles.edit", "roles.void", "roles.view", "roles.assign_permissions"],
  "briefs.manage": ["briefs.view", "briefs.create", "briefs.edit"],
  "content_reviews.manage": ["content_reviews.view", "content_reviews.create", "content_reviews.approve"],
  "documents.manage": ["documents.view", "documents.create", "documents.verify"],
  "expenses.manage": ["expenses.view", "expenses.create", "expenses.edit", "expenses.approve"],
  "calendar.manage": ["calendar.view", "calendar.create", "calendar.edit"],
  "media_kits.manage": ["media_kits.view", "media_kits.create", "media_kits.edit"],
  "relationships.manage": ["relationships.view", "relationships.create", "relationships.edit"],
  "templates.manage": ["templates.view", "templates.create", "templates.edit"],
  "notes.manage": ["notes.view", "notes.create", "notes.edit", "notes.void"],
};

export default function RolesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  const [tab, setTab] = useState("details");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["roles"], queryFn: () => getRoles().then((r) => r.data) });
  const { data: allPermissions } = useQuery({ queryKey: ["permissions"], queryFn: () => getPermissions().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: (d) => createRole(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setCreateOpen(false); setForm({ name: "", description: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => updateRole(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); qc.invalidateQueries({ queryKey: ["role"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteRole(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setEditRole(null); },
  });

  const permMutation = useMutation({
    mutationFn: ({ roleId, permIds }) => assignPermissions(roleId, permIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); qc.invalidateQueries({ queryKey: ["role"] }); },
  });

  const openRoleDetail = async (row) => {
    try {
      const res = await getRole(row.id);
      const role = res.data;
      setForm({ name: role.name, description: role.description || "" });
      // role.permissions is an array of permission code strings
      const permList = allPermissions?.results || allPermissions || [];
      const permIds = new Set(
        permList.filter((p) => role.permissions?.includes(p.code)).map((p) => p.id)
      );
      // Expand manage permissions to include implied sub-permissions
      for (const [manageCode, impliedCodes] of Object.entries(MANAGE_IMPLIES)) {
        const managePerm = permList.find((p) => p.code === manageCode);
        if (managePerm && permIds.has(managePerm.id)) {
          permList.forEach((p) => { if (impliedCodes.includes(p.code)) permIds.add(p.id); });
        }
      }
      setSelectedPerms(permIds);
      setEditRole(role);
      setTab("details");
    } catch {
      // ignore
    }
  };

  const togglePerm = (perm) => {
    const permList = allPermissions?.results || allPermissions || [];
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(perm.id)) {
        next.delete(perm.id);
        // If turning off a manage perm, also turn off all implied
        const impliedCodes = MANAGE_IMPLIES[perm.code];
        if (impliedCodes) {
          permList.forEach((p) => { if (impliedCodes.includes(p.code)) next.delete(p.id); });
        }
      } else {
        next.add(perm.id);
        // If turning on a manage perm, also turn on all implied
        const impliedCodes = MANAGE_IMPLIES[perm.code];
        if (impliedCodes) {
          permList.forEach((p) => { if (impliedCodes.includes(p.code)) next.add(p.id); });
        }
      }
      return next;
    });
  };

  const toggleModule = (modulePerms) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      const allSelected = modulePerms.every((p) => next.has(p.id));
      modulePerms.forEach((p) => { if (allSelected) next.delete(p.id); else next.add(p.id); });
      return next;
    });
  };

  // Check if a sub-permission is implied by an active manage permission
  const isImpliedByManage = (perm) => {
    const permListArr = allPermissions?.results || allPermissions || [];
    for (const [manageCode, impliedCodes] of Object.entries(MANAGE_IMPLIES)) {
      if (impliedCodes.includes(perm.code)) {
        const managePerm = permListArr.find((p) => p.code === manageCode);
        if (managePerm && selectedPerms.has(managePerm.id)) return true;
      }
    }
    return false;
  };

  const savePerms = () => {
    if (editRole) permMutation.mutate({ roleId: editRole.id, permIds: [...selectedPerms] });
  };

  const saveDetails = (e) => {
    e.preventDefault();
    if (editRole) updateMutation.mutate({ id: editRole.id, d: form });
  };

  // Group permissions by module
  const permList = allPermissions?.results || allPermissions || [];
  const modules = {};
  permList.forEach((p) => {
    if (!modules[p.module]) modules[p.module] = [];
    modules[p.module].push(p);
  });
  const moduleNames = Object.keys(modules).sort();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <PageHeader title="Roles" action={() => setCreateOpen(true)} actionLabel="+ Add Role" />
      <DataTable columns={columns} data={data?.results || data} onRowClick={openRoleDetail} />

      {/* Create Role Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add Role">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}>
          <label style={labelStyle}>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <button type="submit" disabled={createMutation.isPending} style={{ ...btnPrimary, width: "100%" }}>
            {createMutation.isPending ? "Saving..." : "Create Role"}
          </button>
        </form>
      </Modal>

      {/* Edit Role + Permissions Drawer */}
      {editRole && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 1000 }} onClick={() => setEditRole(null)}>
          <div style={{ width: 620, maxWidth: "95vw", background: "#fff", height: "100vh", overflow: "auto", padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>Role: {editRole.name}</h2>
              <button onClick={() => setEditRole(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #eee" }}>
              {["details", "permissions"].map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontWeight: tab === t ? 700 : 400, color: tab === t ? "#4fc3f7" : "#888", borderBottom: tab === t ? "2px solid #4fc3f7" : "2px solid transparent", marginBottom: -2, fontSize: 14, textTransform: "capitalize" }}>{t}</button>
              ))}
            </div>

            {/* Details Tab */}
            {tab === "details" && (
              <form onSubmit={saveDetails}>
                <label style={labelStyle}>Role Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="submit" disabled={updateMutation.isPending} style={btnPrimary}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={() => { if (confirm(`Delete role "${editRole.name}"?`)) deleteMutation.mutate(editRole.id); }} style={{ padding: "10px 24px", background: "#ffebee", color: "#d32f2f", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete Role</button>
                </div>
                {updateMutation.isSuccess && <p style={{ color: "#4caf50", fontSize: 13, marginTop: 8 }}>Saved!</p>}
              </form>
            )}

            {/* Permissions Tab */}
            {tab === "permissions" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{selectedPerms.size} permission{selectedPerms.size !== 1 ? "s" : ""} selected</p>
                  <button onClick={savePerms} disabled={permMutation.isPending} style={btnPrimary}>
                    {permMutation.isPending ? "Saving..." : "Save Permissions"}
                  </button>
                </div>
                {permMutation.isSuccess && <p style={{ color: "#4caf50", fontSize: 13, marginBottom: 12 }}>Permissions updated!</p>}

                {moduleNames.map((mod) => {
                  const modPerms = modules[mod];
                  const managePerm = modPerms.find((p) => p.is_manage_shortcut);
                  const subPerms = modPerms.filter((p) => !p.is_manage_shortcut);
                  const manageOn = managePerm && selectedPerms.has(managePerm.id);
                  const allChecked = modPerms.every((p) => selectedPerms.has(p.id));
                  const someChecked = modPerms.some((p) => selectedPerms.has(p.id));
                  return (
                    <div key={mod} style={{ marginBottom: 16, background: "#f8f9fa", borderRadius: 8, overflow: "hidden" }}>
                      {/* Module header with select-all */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: someChecked ? "#e3f2fd" : "#f0f0f0", borderBottom: "1px solid #e0e0e0" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }} onChange={() => toggleModule(modPerms)} style={{ width: 16, height: 16 }} />
                          <span style={{ fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{mod.replace(/_/g, " ")}</span>
                          <span style={{ fontSize: 12, color: "#999" }}>({modPerms.filter((p) => selectedPerms.has(p.id)).length}/{modPerms.length})</span>
                        </label>
                      </div>
                      <div style={{ padding: "12px 16px" }}>
                        {/* Manage toggle — master switch */}
                        {managePerm && (
                          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 10, padding: "8px 12px", background: manageOn ? "#e8f5e9" : "#fff", borderRadius: 6, border: manageOn ? "1px solid #a5d6a7" : "1px solid #e0e0e0" }}>
                            <input type="checkbox" checked={selectedPerms.has(managePerm.id)} onChange={() => togglePerm(managePerm)} style={{ width: 16, height: 16, accentColor: "#4caf50" }} />
                            <span style={{ fontWeight: 700, fontSize: 13 }}>Full Access (Manage)</span>
                            <span style={{ fontSize: 11, color: "#888", marginLeft: 4 }}>— grants all permissions below</span>
                          </label>
                        )}
                        {/* Individual permissions */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", paddingLeft: managePerm ? 12 : 0 }}>
                          {subPerms.map((p) => {
                            const locked = isImpliedByManage(p);
                            return (
                              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: locked ? "default" : "pointer", fontSize: 13, padding: "3px 0", opacity: locked ? 0.55 : 1 }}>
                                <input type="checkbox" checked={selectedPerms.has(p.id) || locked} onChange={() => { if (!locked) togglePerm(p); }} disabled={locked} style={{ width: 14, height: 14 }} />
                                <span>{p.action.replace(/_/g, " ")}</span>
                                {locked && <span style={{ fontSize: 10, color: "#999" }}>via manage</span>}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
