import axios from "axios";
import type { Role } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sipena_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setApiRole = (role: Role, kecamatanId?: number) => {
  api.defaults.headers.common["X-User-Role"] = role;
  if (kecamatanId) api.defaults.headers.common["X-Kecamatan-Id"] = String(kecamatanId);
};

export default api;
