import axios from "axios";

const LOCAL_API_URL = "http://localhost:5000/api";
const PRODUCTION_API_URL = "https://angelshome-1.onrender.com/api";

function resolveApiUrl() {
  const configured = String(import.meta.env.VITE_API_URL || "").trim();
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(host);

  // Explicit configuration always wins so a local development build can use
  // the same remote database/API as the deployed application.
  if (configured) return configured;
  if (isLocal) return LOCAL_API_URL;
  return PRODUCTION_API_URL;
}

const baseURL = resolveApiUrl().replace(/\/$/, "");
const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(host);
const shouldFallbackLocally = isLocal && baseURL !== LOCAL_API_URL;

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("angelshome_token") || localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;
    const isNetworkError = !error?.response;
    if (!config || !shouldFallbackLocally || !isNetworkError || config.__localFallbackTried) {
      return Promise.reject(error);
    }

    config.__localFallbackTried = true;
    config.baseURL = LOCAL_API_URL;
    return api.request(config);
  }
);

export default api;
