import axios from "axios";

const LOCAL_API_URL = "http://localhost:5000/api";
const PRODUCTION_API_URL = "https://angelshome-1.onrender.com/api";

function resolveApiUrl() {
  const configured = String(import.meta.env.VITE_API_URL || "").trim();
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0.0.1)$/i.test(host);

  // Explicit configuration always wins. This keeps local and deployed builds
  // consistent with the database/API environment selected by VITE_API_URL.
  if (configured) return configured;
  if (isLocal) return LOCAL_API_URL;
  return PRODUCTION_API_URL;
}

const baseURL = resolveApiUrl().replace(/\/$/, "");

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("angelshome_token") || localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
