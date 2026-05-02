import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { setApiRole } from "./api/client";
import { AuthProvider } from "./state/AuthContext";

const savedRole = localStorage.getItem("sipena_role");
if (savedRole) {
  setApiRole(savedRole as any, Number(localStorage.getItem("sipena_kecamatan_id") ?? 0));
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
);
