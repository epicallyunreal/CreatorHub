import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

/* Restore session synchronously from localStorage before the first render */
function restoreSession() {
  const token = localStorage.getItem("access_token");
  if (token) {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 > Date.now()) {
        return { user: decoded, isAuthenticated: true, actorType: decoded.actor_type, _ready: true };
      }
    } catch { /* invalid token — fall through */ }
  }
  return { user: null, isAuthenticated: false, actorType: null, _ready: true };
}

const useAuthStore = create((set, get) => ({
  ...restoreSession(),

  initialize: () => {
    set(restoreSession());
  },

  login: (access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    const decoded = jwtDecode(access);
    set({ user: decoded, isAuthenticated: true, actorType: decoded.actor_type });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false, actorType: null });
  },

  isSuperAdmin: () => get().actorType === "user",
}));

export default useAuthStore;
