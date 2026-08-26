const LOCAL_API_URL = "http://localhost:5000/api";
const PRODUCTION_API_URL = "https://angelshome-1.onrender.com/api";

function resolveApiUrl() {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(hostname);

  // Local development always uses the local Express API. This prevents a
  // developer's production VITE_API_URL from accidentally breaking localhost.
  if (isLocalhost) return LOCAL_API_URL;

  const configured = String(import.meta.env.VITE_API_URL || "").trim();
  if (configured) return configured;

  return PRODUCTION_API_URL;
}

const configuredApiUrl = resolveApiUrl();
const API_URL = `${configuredApiUrl.replace(/\/$/, "")}${/\/api$/i.test(configuredApiUrl) ? "" : "/api"}`;

export function getApiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

export function getAdminToken() { return localStorage.getItem("adminToken"); }
export function getSchoolToken() { return localStorage.getItem("angelshome_token"); }
export function clearAdminToken() { localStorage.removeItem("adminToken"); }
export function clearSchoolToken() { localStorage.removeItem("angelshome_token"); localStorage.removeItem("angelshome_session"); }

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getSchoolToken() || getAdminToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(getApiUrl(path), { ...options, headers });
  } catch {
    throw new Error(`Unable to reach the API at ${API_URL}. Check that the server is running and that the API URL is correct for this environment.`);
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json().catch(() => ({})) : await response.text();
  if (!response.ok) {
    const error = new Error(typeof payload === "object" && payload?.message ? payload.message : `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const authApi = {
  login: (body) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me: () => apiRequest("/auth/me"),
};

export const portalApi = {
  dashboard: () => apiRequest("/portal/dashboard"),
  metrics: () => apiRequest("/dashboard-metrics"),
};

export const smisApi = {
  timetable: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));
    return apiRequest(`/smis/timetable${query.toString() ? `?${query}` : ""}`);
  },
};

export const notificationApi = {
  list: () => apiRequest("/notifications"),
  read: (id) => apiRequest(`/notifications/${id}/read`, { method: "PATCH" }),
};

export default API_URL;
