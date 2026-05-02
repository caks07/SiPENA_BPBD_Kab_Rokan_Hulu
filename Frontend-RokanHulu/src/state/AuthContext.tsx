import { createContext, useContext, useMemo, useState } from "react";
import { login as loginApi, logout as logoutApi, type AuthUser } from "../api/auth";
import type { PropsWithChildren } from "react";
import type { Role } from "../types";
import { setApiRole } from "../api/client";

type AuthState = {
  user: AuthUser | null;
  role: Role | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const stored = localStorage.getItem("sipena_user");
  const [user, setUser] = useState<AuthUser | null>(stored ? JSON.parse(stored) : null);
  const [role, setRole] = useState<Role | null>((localStorage.getItem("sipena_role") as Role | null) ?? null);

  const login = async (username: string, password: string) => {
    const data = await loginApi(username, password);
    localStorage.setItem("sipena_token", data.token);
    localStorage.setItem("sipena_role", data.user.role);
    localStorage.setItem("sipena_kecamatan_id", String(data.user.kecamatan_id ?? 0));
    localStorage.setItem("sipena_user", JSON.stringify(data.user));
    setApiRole(data.user.role, data.user.kecamatan_id ?? 0);
    setRole(data.user.role);
    setUser(data.user);
  };

  const logout = async () => {
    try { await logoutApi(); } catch (_) {}
    localStorage.clear();
    setRole(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, role, login, logout }), [user, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus dipakai dalam AuthProvider.");
  return context;
}
