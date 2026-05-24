import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTags, createTag, getTagMappings, createTagMapping, deleteTagMapping } from "../../api/endpoints";

export default function TagManager({ entityType, entityId }) {
  const qc = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: allTags } = useQuery({
    queryKey: ["tags", entityType],
    queryFn: () => getTags({ entity_type: entityType }).then((r) => r.data),
  });

  const { data: mappings } = useQuery({
    queryKey: ["tagMappings", entityType, entityId],
    queryFn: () => getTagMappings({ entity_type: entityType, entity_id: entityId }).then((r) => r.data),
    enabled: !!entityId,
  });

  const addMapping = useMutation({
    mutationFn: (d) => createTagMapping(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tagMappings", entityType, entityId] }),
  });

  const removeMapping = useMutation({
    mutationFn: (id) => deleteTagMapping(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tagMappings", entityType, entityId] }),
  });

  const addTag = useMutation({
    mutationFn: (d) => createTag(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      addMapping.mutate({ tag: res.data.id, entity_type: entityType, entity_id: entityId });
      setNewTag("");
      setShowCreate(false);
    },
  });

  const tagList = allTags?.results || allTags || [];
  const mappingList = mappings?.results || mappings || [];
  const assignedTagIds = mappingList.map((m) => m.tag);
  const unassigned = tagList.filter((t) => !assignedTagIds.includes(t.id));

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Tags</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {mappingList.map((m) => (
          <span key={m.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: m.tag_color + "22", color: m.tag_color, border: `1px solid ${m.tag_color}44` }}>
            {m.tag_name}
            <button onClick={() => removeMapping.mutate(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold", fontSize: 14, lineHeight: 1 }}>×</button>
          </span>
        ))}
        {mappingList.length === 0 && <span style={{ color: "#999", fontSize: 13 }}>No tags</span>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {unassigned.length > 0 && (
          <select onChange={(e) => { if (e.target.value) addMapping.mutate({ tag: parseInt(e.target.value), entity_type: entityType, entity_id: entityId }); e.target.value = ""; }} style={{ padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}>
            <option value="">+ Add tag...</option>
            {unassigned.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        {!showCreate ? (
          <button onClick={() => setShowCreate(true)} style={{ padding: "6px 12px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>+ New Tag</button>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (newTag.trim()) addTag.mutate({ name: newTag.trim(), entity_type: entityType }); }} style={{ display: "flex", gap: 4 }}>
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Tag name" style={{ padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, width: 120 }} />
            <button type="submit" style={{ padding: "6px 10px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>✓</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "6px 10px", background: "#eee", border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>✕</button>
          </form>
        )}
      </div>
    </div>
  );
}
