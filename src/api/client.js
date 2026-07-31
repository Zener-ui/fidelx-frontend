import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: inject JWT ──────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("cm_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalize errors ───────────────────
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Something went wrong.";

    // Token expired or invalid — force logout
    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
      return Promise.reject({ status, message: "Session expired. Please log in again." });
    }

    // Server error
    if (status >= 500) {
      toast.error("Server error. Please try again shortly.");
    }

    return Promise.reject({ status, message, data: error.response?.data });
  }
);

export default client;
