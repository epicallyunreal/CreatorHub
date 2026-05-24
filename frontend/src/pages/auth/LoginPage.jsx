import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../api/endpoints";
import useAuthStore from "../../stores/authStore";
import OnboardingWizard from "./OnboardingWizard";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);

  const mutation = useMutation({
    mutationFn: () => login(form),
    onSuccess: (res) => {
      const { access, refresh } = res.data;
      authLogin(access, refresh);
      const decoded = JSON.parse(atob(access.split(".")[1]));
      navigate(decoded.actor_type === "user" ? "/admin" : "/dashboard");
    },
    onError: (err) => {
      setError(err.response?.data?.detail || "Invalid credentials");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    mutation.mutate();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: 400, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 28, textAlign: "center" }}>CollabIQ</h1>
        <p style={{ margin: "0 0 24px", textAlign: "center", color: "#888", fontSize: 14 }}>Sign in to your account</p>
        {error && <div style={{ background: "#fff3f3", color: "#d32f2f", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" }}>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 16, fontSize: 14, boxSizing: "border-box" }} />
          <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#555" }}>Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8, marginBottom: 24, fontSize: 14, boxSizing: "border-box" }} />
          <button type="submit" disabled={mutation.isPending} style={{ width: "100%", padding: "12px", background: "#4fc3f7", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: mutation.isPending ? 0.7 : 1 }}>
            {mutation.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20, paddingTop: 20, borderTop: "1px solid #eee" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#888" }}>Don't have an account?</p>
          <button onClick={() => setShowOnboarding(true)} style={{ width: "100%", padding: "12px", background: "transparent", color: "#4fc3f7", border: "2px solid #4fc3f7", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Create Account
          </button>
        </div>
      </div>
      {showOnboarding && (
        <OnboardingWizard
          onClose={() => setShowOnboarding(false)}
          onSuccess={() => navigate("/dashboard")}
        />
      )}
    </div>
  );
}
