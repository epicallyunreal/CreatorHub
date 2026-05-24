import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: () => getNotifications().then((r) => r.data) });

  const markRead = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) return <p>Loading...</p>;

  const items = data?.results || data || [];

  return (
    <div>
      <PageHeader title="Notifications" action={() => markAll.mutate()} actionLabel="Mark All Read" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 && <p style={{ color: "#999", textAlign: "center", padding: 40 }}>No notifications</p>}
        {items.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markRead.mutate(n.id)}
            style={{
              background: n.is_read ? "#fff" : "#e3f2fd",
              borderRadius: 10,
              padding: "16px 20px",
              cursor: n.is_read ? "default" : "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              borderLeft: n.is_read ? "3px solid transparent" : "3px solid #4fc3f7",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: n.is_read ? 400 : 600, fontSize: 14 }}>{n.title || n.message}</span>
              <span style={{ fontSize: 12, color: "#999" }}>{n.created_at?.slice(0, 10)}</span>
            </div>
            {n.message && n.title && <p style={{ margin: "6px 0 0", fontSize: 13, color: "#666" }}>{n.message}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
