import { Navigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import type { Role } from "../types";
import { useAuth } from "../state/AuthContext";

type Props = PropsWithChildren<{ allow: Role[] }>;

export default function RoleRoute({ allow, children }: Props) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (!allow.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
