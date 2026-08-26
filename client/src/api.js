import axios from "axios";

const LOCAL_API_URL = "http://localhost:5000/api";
const PRODUCTION_API_URL = "https://angelshome-1.onrender.com/api";

function resolveApiUrl() {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(host);
  if (isLocal) return LOCAL_API_URL;
  return String(import.meta.env.VITE_API_URL || PRODUCTION_API_URL).trim() || PRODUCTION_API_URL;
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
