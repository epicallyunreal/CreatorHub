import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmployee, createEmployee, updateEmployee, getRoles, getEmployees } from "../../api/endpoints";
import { inputStyle, labelStyle, fieldStyle, rowStyle, sectionStyle, sectionTitle, btnPrimary, btnSecondary, errorStyle } from "../../components/ui/formStyles";

const emptyEmployee = { first_name: "", last_name: "", email: "", username: "", phone: "", designation: "", role: "", reports_to: "", password: "", date_of_joining: "" };

export default function EmployeeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...emptyEmployee });
  const [error, setError] = useState("");

  const { data: employee } = useQuery({ queryKey: ["employee", id], queryFn: () => getEmployee(id).then((r) => r.data), enabled: isEdit });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => getRoles().then((r) => r.data) });
  const { data: employees } = useQuery({ queryKey: ["employees"], queryFn: () => getEmployees().then((r) => r.data) });

  useEffect(() => {
    if (employee) {
      setForm({
        first_name: employee.first_name || "", last_name: employee.last_name || "",
        email: employee.email || "", username: employee.username || "", phone: employee.phone || "",
        designation: employee.designation || "", role: employee.role || "", reports_to: employee.reports_to || "",
        password: "", date_of_joining: employee.date_of_joining || "",
      });
    }
  }, [employee]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateEmployee(id, data) : createEmployee(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); navigate("/employees"); },
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
    if (!payload.reports_to) delete payload.reports_to;
    if (!payload.date_of_joining) delete payload.date_of_joining;
    if (isEdit && !payload.password) delete payload.password;
    mutation.mutate(payload);
  };

  const roleList = roles?.results || roles || [];
  const empList = (employees?.results || employees || []).filter((e) => String(e.id) !== String(id));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate("/employees")} style={btnSecondary}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 24 }}>{isEdit ? "Edit Employee" : "Add New Employee"}</h1>
      </div>
      {error && <div style={errorStyle}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={sectionStyle}>
          <h3 style={sectionTitle}>Personal Information</h3>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>First Name *</label>
              <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Last Name *</label>
              <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} required style={inputStyle} />
            </div>
          </div>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Username *</label>
              <input value={form.username} onChange={(e) => set("username", e.target.value)} required style={inputStyle} />
            </div>
          </div>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Date of Joining</label>
              <input type="date" value={form.date_of_joining} onChange={(e) => set("date_of_joining", e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitle}>Role & Reporting</h3>
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Role *</label>
              <select value={form.role} onChange={(e) => set("role", e.target.value)} required style={inputStyle}>
                <option value="">-- Select Role --</option>
                {roleList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Designation</label>
              <input value={form.designation} onChange={(e) => set("designation", e.target.value)} style={inputStyle} placeholder="Manager, Lead, Executive..." />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Reports To</label>
            <select value={form.reports_to} onChange={(e) => set("reports_to", e.target.value)} style={inputStyle}>
              <option value="">-- None --</option>
              {empList.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.designation || e.email})</option>)}
            </select>
          </div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitle}>{isEdit ? "Change Password" : "Set Password"}</h3>
          <div style={fieldStyle}>
            <label style={labelStyle}>Password {isEdit ? "(leave blank to keep current)" : "*"}</label>
            <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required={!isEdit} style={inputStyle} placeholder={isEdit ? "Leave blank to keep current" : "Minimum 8 characters"} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => navigate("/employees")} style={btnSecondary}>Cancel</button>
          <button type="submit" disabled={mutation.isPending} style={{ ...btnPrimary, opacity: mutation.isPending ? 0.7 : 1 }}>
            {mutation.isPending ? "Saving..." : isEdit ? "Update Employee" : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
