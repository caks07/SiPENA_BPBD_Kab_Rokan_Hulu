import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import RoleRoute from "./components/RoleRoute";
import LandingPage from "./pages/LandingPage";
import FormFlow from "./pages/FormFlow";
import DashboardMapPage from "./pages/DashboardMapPage";
import RekapKabPage from "./pages/RekapKabPage";
import RekapKecPage from "./pages/RekapKecPage";
import InfografisPage from "./pages/InfografisPage";
import DetailPage from "./pages/DetailPage";
import EditPage from "./pages/EditPage";
import EditDetailPage from "./pages/EditDetailPage";
import DashboardTablePage from "./pages/DashboardTablePage";
import LoginPage from "./pages/LoginPage";
import AdministratorPage from "./pages/AdministratorPage";
import LogAktivitasPage from "./pages/LogAktivitasPage";

import { useAuth } from "./state/AuthContext";

function DashboardResolver() {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;

  if (role === "operator") {
    // Operator kecamatan → tabel rekap kecamatan
    return <RekapKecPage />;
  }

  // Admin kabupaten & Kepala BPBD → peta penuh
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <DashboardMapPage />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lapor" element={<FormFlow />} />

        {/* Dashboard (role-adaptive) */}
        <Route
          path="/dashboard"
          element={
            <RoleRoute allow={["operator", "admin", "admin_kab", "pimpinan"]}>
              <DashboardResolver />
            </RoleRoute>
          }
        />

        {/* Rekap Kabupaten — Admin Kab & Pimpinan */}
        <Route
          path="/rekap/kabupaten"
          element={
            <RoleRoute allow={["admin", "admin_kab", "pimpinan"]}>
              <RekapKabPage />
            </RoleRoute>
          }
        />

        {/* Rekap Kecamatan — Operator ONLY */}
        <Route
          path="/rekap/kecamatan"
          element={
            <RoleRoute allow={["operator"]}>
              <RekapKecPage />
            </RoleRoute>
          }
        />

        {/* Infografis — Admin Kab & Pimpinan */}
        <Route
          path="/infografis"
          element={
            <RoleRoute allow={["admin", "admin_kab", "pimpinan"]}>
              <InfografisPage />
            </RoleRoute>
          }
        />

        {/* Administrator — Admin Kab Only */}
        <Route
          path="/administrator"
          element={
            <RoleRoute allow={["admin", "admin_kab"]}>
              <AdministratorPage />
            </RoleRoute>
          }
        />

        {/* Log Aktivitas — Admin Kab Only */}
        <Route
          path="/log-aktivitas"
          element={
            <RoleRoute allow={["admin", "admin_kab"]}>
              <LogAktivitasPage />
            </RoleRoute>
          }
        />

        {/* Detail — semua role */}
        <Route
          path="/detail/:id"
          element={
            <RoleRoute allow={["operator", "admin", "admin_kab", "pimpinan"]}>
              <DetailPage />
            </RoleRoute>
          }
        />

        {/* Edit — hanya Admin Kab & Operator */}
        <Route
          path="/edit/:id"
          element={
            <RoleRoute allow={["operator", "admin", "admin_kab"]}>
              <EditPage />
            </RoleRoute>
          }
        />

        {/* Edit Detail — hanya Admin Kab & Operator */}
        <Route
          path="/edit-detail/:id"
          element={
            <RoleRoute allow={["operator", "admin", "admin_kab"]}>
              <EditDetailPage />
            </RoleRoute>
          }
        />

        {/* Dashboard Table (fallback/direct) */}
        <Route
          path="/dashboard/table"
          element={
            <RoleRoute allow={["admin", "admin_kab", "pimpinan"]}>
              <DashboardTablePage />
            </RoleRoute>
          }
        />

        {/* Legacy redirect */}
        <Route path="/rekap" element={<Navigate to="/rekap/kabupaten" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
