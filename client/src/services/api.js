const LOCAL_API_URL = "http://localhost:5000/api";
const PRODUCTION_API_URL = "https://angelshome-1.onrender.com/api";

function resolveApiUrl() {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocalhost = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
  const configured = String(import.meta.env.VITE_API_URL || "").trim();

  // Respect an explicitly configured API everywhere. When localhost is using
  // a remote API, apiRequest() below provides a local-network fallback.
  if (configured) return configured;
  if (isLocalhost) return LOCAL_API_URL;
  return PRODUCTION_API_URL;
}

const configuredApiUrl = resolveApiUrl();
const API_URL = `${configuredApiUrl.replace(/\/$/, "")}${/\/api$/i.test(configuredApiUrl) ? "" : "/api"}`;
const HOSTNAME = typeof window !== "undefined" ? window.location.hostname : "";
const IS_LOCALHOST = /^(localhost|127\.0\.0\.1)$/i.test(HOSTNAME);
const LOCAL_FALLBACK_URL = `${LOCAL_API_URL}`;

export function getApiUrl(path = "", baseUrl = API_URL) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function getAdminToken() { return localStorage.getItem("adminToken"); }
export function getSchoolToken() { return localStorage.getItem("angelshome_token"); }
export function clearAdminToken() { localStorage.removeItem("adminToken"); }
export function clearSchoolToken() { localStorage.removeItem("angelshome_token"); localStorage.removeItem("angelshome_session"); }

async function requestOnce(url, options, headers) {
  return fetch(url, { ...options, headers });
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getSchoolToken() || getAdminToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  const primaryUrl = getApiUrl(path);
  let response;
  try {
    response = await requestOnce(primaryUrl, options, headers);
  } catch (primaryError) {
    // During local development, gracefully fall back to the local API when a
    // configured remote API is unreachable. Do not hide HTTP errors from a
    // reachable API; only retry genuine network failures.
    if (!(IS_LOCALHOST && API_URL !== LOCAL_FALLBACK_URL)) {
      throw new Error(`Unable to reach the API at ${API_URL}. Check that the server is running and that the API URL is correct for this environment.`);
    }

    try {
      response = await requestOnce(getApiUrl(path, LOCAL_FALLBACK_URL), options, headers);
    } catch {
      const error = new Error(`Unable to reach the configured API at ${API_URL} or the local API at ${LOCAL_FALLBACK_URL}. Check that the Render/local server is running and that the API URL is correct.`);
      error.cause = primaryError;
      throw error;
    }
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
