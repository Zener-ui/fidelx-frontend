import { create } from "zustand";

const TOKEN_KEY = "cm_token";
const USER_KEY = "cm_user";

export const useAuthStore = create((set, get) => ({
  token: sessionStorage.getItem(TOKEN_KEY) || null,
  user: (() => {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; }
  })(),
  isAuthenticated: !!sessionStorage.getItem(TOKEN_KEY),

  login: (token, user) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  hydrate: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const raw = sessionStorage.getItem(USER_KEY);
    try {
      const user = raw ? JSON.parse(raw) : null;
      set({ token, user, isAuthenticated: !!token });
    } catch {
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  // Derived helpers
  role: () => get().user?.role || null,
  isRole: (r) => get().user?.role === r,
}));
