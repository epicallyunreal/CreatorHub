import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCalendar } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

  const { data } = useQuery({
    queryKey: ["calendar", startDate, endDate],
    queryFn: () => getCalendar({ start_date: startDate, end_date: endDate }).then((r) => r.data),
  });

  const events = data?.results || data || [];
  const eventsByDate = {};
  events.forEach((e) => {
    const d = e.due_date || e.start_date;
    if (d) { if (!eventsByDate[d]) eventsByDate[d] = []; eventsByDate[d].push(e); }
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  return (
    <div>
      <PageHeader title="Calendar" />
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={prev} style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 18 }}>←</button>
        <h2 style={{ margin: 0 }}>{MONTHS[month]} {year}</h2>
        <button onClick={next} style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 18 }}>→</button>
        <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }} style={{ padding: "8px 12px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Today</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#e0e0e0", borderRadius: 8, overflow: "hidden" }}>
        {DAYS.map((d) => (
          <div key={d} style={{ background: "#f5f5f5", padding: "10px 8px", fontWeight: 700, textAlign: "center", fontSize: 13 }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : null;
          const dayEvents = dateStr ? eventsByDate[dateStr] || [] : [];
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div key={i} style={{ background: "#fff", minHeight: 90, padding: 6, position: "relative" }}>
              {day && (
                <>
                  <div style={{ fontWeight: isToday ? 700 : 400, color: isToday ? "#4fc3f7" : "#333", fontSize: 14, marginBottom: 4 }}>
                    {isToday ? <span style={{ background: "#4fc3f7", color: "#fff", borderRadius: "50%", width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{day}</span> : day}
                  </div>
                  {dayEvents.slice(0, 3).map((e, j) => (
                    <div key={j} style={{ fontSize: 11, padding: "2px 4px", marginBottom: 2, borderRadius: 3, background: e.is_completed ? "#c8e6c9" : "#fff3e0", color: e.is_completed ? "#2e7d32" : "#e65100", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <div style={{ fontSize: 10, color: "#999" }}>+{dayEvents.length - 3} more</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
