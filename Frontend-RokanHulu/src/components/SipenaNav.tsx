/**
 * SipenaNav — Shared top navigation bar (RESPONSIVE)
 * Dipakai di: DashboardMapPage, RekapKabPage, RekapKecPage, DetailPage, InfografisPage, EditPage
 */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

type NavItem = { label: string; to: string };

const NAV_ADMIN_KAB: NavItem[] = [
  { label: "Peta Interaktif", to: "/dashboard" },
  { label: "Rekap Kabupaten", to: "/rekap/kabupaten" },
  { label: "Infografis", to: "/infografis" },
];

// Pimpinan (Kepala BPBD): bisa lihat rekap kab tapi tanpa aksi edit
const NAV_PIMPINAN: NavItem[] = [
  { label: "Peta Interaktif", to: "/dashboard" },
  { label: "Rekap Kabupaten", to: "/rekap/kabupaten" },
  { label: "Infografis", to: "/infografis" },
];

// Operator: hanya rekap kecamatan wilayahnya
const NAV_OPERATOR: NavItem[] = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Rekap Kecamatan", to: "/rekap/kecamatan" },
];

export default function SipenaNav() {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems =
    role === "pimpinan"
      ? NAV_PIMPINAN
      : role === "operator"
      ? NAV_OPERATOR
      : NAV_ADMIN_KAB;

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <>
      <header
        className="fixed top-0 left-0 w-full h-16 flex justify-between items-center px-4 md:px-6 z-[1000] border-b border-white/10 shadow-xl"
        style={{ background: "rgba(28,31,43,0.95)", backdropFilter: "blur(12px)" }}
      >
        {/* Logo + Desktop Nav Links */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <img src="/logo_sipena.png" alt="Logo SIPENA" className="h-10 w-auto" />
            <span className="text-xl font-bold text-white tracking-widest uppercase select-none flex-shrink-0">SiPENA</span>
          </Link>
          <div className="h-5 w-px bg-white/20 hidden md:block" />
          <nav className="hidden md:flex items-center gap-5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium transition-colors whitespace-nowrap pb-0.5 ${
                  isActive(item.to)
                    ? "text-[#F39200] border-b-2 border-[#F39200]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: User info + hamburger */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Location chip — hidden on mobile */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
            <span className="material-symbols-outlined text-sm">location_on</span>
            Rokan Hulu
          </div>
          {/* Role badge */}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 uppercase tracking-wide flex-shrink-0">
            {role}
          </span>
          {/* Username — hidden on small mobile */}
          <span className="text-white/60 text-xs hidden sm:block flex-shrink-0 max-w-[100px] truncate">
            {user?.name}
          </span>
          {/* Logout */}
          <button
            onClick={logout}
            title="Keluar"
            className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-full text-white/70 hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[999] bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer panel */}
          <div
            className="fixed top-16 left-0 right-0 z-[1000] md:hidden border-t border-white/10"
            style={{ background: "rgba(28,31,43,0.98)", backdropFilter: "blur(12px)" }}
          >
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(item.to)
                      ? "bg-[#F39200]/20 text-[#F39200]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {item.to.includes("dashboard") ? "map" :
                     item.to.includes("rekap") ? "table_chart" :
                     item.to.includes("infografis") ? "bar_chart" : "circle"}
                  </span>
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="px-4 py-2 flex items-center gap-2 text-white/50 text-xs">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  Rokan Hulu, Riau
                </div>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
