import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotes, createNote, deleteNote } from "../../api/endpoints";

export default function ActivityFeed({ entityType, entityId }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["notes", entityType, entityId],
    queryFn: () => getNotes({ entity_type: entityType, entity_id: entityId }).then((r) => r.data),
    enabled: !!entityId,
  });

  const addMutation = useMutation({
    mutationFn: (d) => createNote(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notes", entityType, entityId] }); setText(""); },
  });

  const delMutation = useMutation({
    mutationFn: (id) => deleteNote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", entityType, entityId] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addMutation.mutate({ entity_type: entityType, entity_id: entityId, text });
  };

  const notes = data?.results || data || [];

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>Activity / Notes</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6 }} />
        <button type="submit" disabled={addMutation.isPending} style={{ padding: "8px 16px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Post</button>
      </form>
      {isLoading && <p style={{ color: "#999" }}>Loading...</p>}
      {notes.length === 0 && !isLoading && <p style={{ color: "#999", fontSize: 13 }}>No notes yet</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {notes.map((n) => (
          <div key={n.id} style={{ padding: 12, background: "#f8f9fa", borderRadius: 6, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <strong style={{ fontSize: 13 }}>{n.author_name || "Employee"}</strong>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#999" }}>{n.created_at?.slice(0, 16).replace("T", " ")}</span>
                <button onClick={() => delMutation.mutate(n.id)} style={{ background: "none", border: "none", color: "#e57373", cursor: "pointer", fontSize: 12 }}>×</button>
              </div>
            </div>
            <div>{n.text}</div>
            {n.replies?.length > 0 && (
              <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: "2px solid #ddd" }}>
                {n.replies.map((r) => (
                  <div key={r.id} style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>{r.author_name}</strong>: {r.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
