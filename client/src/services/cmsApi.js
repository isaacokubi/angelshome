import { apiRequest } from "./api";

export const cmsApi = {
  get: (endpoint) => apiRequest(`/cms${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`),
  create: (endpoint, data) =>
    apiRequest(`/cms${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (endpoint, data) =>
    apiRequest(`/cms${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (endpoint) =>
    apiRequest(`/cms${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`, {
      method: "DELETE",
    }),
};
