import api from "./client";
import type { Role } from "../types";

export type AuthUser = {
  id: number;
  name: string;
  username: string;
  role: Role;
  kecamatan_id?: number | null;
  kecamatan_nama?: string | null;
};

export const login = async (username: string, password: string) => {
  const { data } = await api.post("/auth/login", { username, password });
  return data as { token: string; user: AuthUser };
};

export const me = async () => {
  const { data } = await api.get("/auth/me");
  return data as AuthUser;
};

export const logout = async () => {
  await api.post("/auth/logout");
};
