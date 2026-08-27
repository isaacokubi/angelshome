import { apiRequest } from "./api";

export const adminRecordsApi = {
  types: () => apiRequest("/admin/records"),
  list: (type, params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));
    return apiRequest(`/admin/records/${type}${query.toString() ? `?${query}` : ""}`);
  },
  update: (type, id, body) => apiRequest(`/admin/records/${type}/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (type, id) => apiRequest(`/admin/records/${type}/${id}`, { method: "DELETE" }),
};
