import { apiRequest } from "./api";

export const settingsApi = {
  get: () => apiRequest("/admin/settings"),
  update: (data) => apiRequest("/admin/settings", { method: "PUT", body: JSON.stringify(data) }),
};
