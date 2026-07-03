/**
 * SipenaNav — Shared top navigation bar (RESPONSIVE)
 * Dipakai di: DashboardMapPage, RekapKabPage, RekapKecPage, DetailPage, InfografisPage, EditPage
 */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import api from "../api/client";

type NavItem = { label: string; to: string };

const NAV_ADMIN_KAB: NavItem[] = [
  { label: "Peta Interaktif", to: "/dashboard" },
  { label: "Rekap Kabupaten", to: "/rekap/kabupaten" },
  { label: "Infografis", to: "/infografis" },
  { label: "Log Aktivitas", to: "/log-aktivitas" },
  { label: "Administrator", to: "/administrator" },
];

// Pimpinan (Kepala BPBD): bisa lihat rekap kab tapi tanpa aksi edit
const NAV_PIMPINAN: NavItem[] = [
  { label: "Peta Interaktif", to: "/dashboard" },
  { label: "Rekap Kabupaten", to: "/rekap/kabupaten" },
  { label: "Infografis", to: "/infografis" },
];

const NAV_OPERATOR: NavItem[] = [
  { label: "Rekap Kecamatan", to: "/rekap/kecamatan" },
];

export default function SipenaNav() {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPanduan, setShowPanduan] = useState(false);
  const [guides, setGuides] = useState<any[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);

  const fetchGuides = async () => {
    setLoadingGuides(true);
    try {
      const { data } = await api.get("/manual-books");
      setGuides(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGuides(false);
    }
  };

  const handleOpenPanduan = () => {
    setShowPanduan(true);
    fetchGuides();
  };

  const handleDownload = async (id: number, filename: string) => {
    try {
      const response = await api.get(`/manual-books/${id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Gagal mengunduh manual book.");
    }
  };

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
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo_sipena.png" alt="Logo SIPENA" className="h-9 w-auto" />
            <span className="text-lg font-bold text-white tracking-widest uppercase select-none flex-shrink-0">SiPENA</span>
          </Link>
          <div className="h-5 w-px bg-white/20 hidden md:block" />
          <nav className="hidden md:flex items-center gap-5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium transition-colors whitespace-nowrap pb-0.5 ${isActive(item.to)
                  ? "text-[#F39200] border-b-2 border-[#F39200]"
                  : "text-white/70 hover:text-white"
                  }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleOpenPanduan}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              Panduan
            </button>
          </nav>
        </div>

        {/* Right: User info + hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-4">
          {/* Location chip — hidden on mobile */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
            <span className="material-symbols-outlined text-sm">location_on</span>
            Rokan Hulu
          </div>
          {/* Role badge */}
          <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 uppercase tracking-wide flex-shrink-0">
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
            className="p-1.5 sm:p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">logout</span>
          </button>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-1.5 sm:p-2 rounded-full text-white/70 hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive(item.to)
                    ? "bg-[#F39200]/20 text-[#F39200]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {item.to.includes("dashboard") ? "map" :
                      item.to.includes("rekap") ? "table_chart" :
                        item.to.includes("infografis") ? "bar_chart" :
                          item.to.includes("log-aktivitas") ? "history" :
                            item.to.includes("administrator") ? "manage_accounts" : "circle"}
                  </span>
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleOpenPanduan();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-all w-full text-left"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                Panduan Aplikasi
              </button>
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

      {/* Modal Panduan Aplikasi */}
      {showPanduan && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[500px] overflow-hidden animate-fade-in">
            <header className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">menu_book</span>
                <h3 className="font-bold text-base">Panduan Penggunaan Aplikasi</h3>
              </div>
              <button
                onClick={() => setShowPanduan(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined block text-[22px]">close</span>
              </button>
            </header>

            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4">
                Silakan unduh dokumen panduan (PDF) di bawah ini untuk mempelajari cara mengoperasikan sistem SiPENA.
              </p>

              {loadingGuides ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="animate-spin w-8 h-8 rounded-full border-4 border-amber-400 border-t-transparent mx-auto mb-2" />
                  Memuat daftar panduan...
                </div>
              ) : guides.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400">
                  <span className="material-symbols-outlined text-3xl block mb-1 text-slate-300">find_in_page</span>
                  Belum ada dokumen panduan yang diunggah.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {guides.map((g) => (
                    <div
                      key={g.id}
                      className="border border-slate-100 rounded-xl p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="material-symbols-outlined text-red-500 text-[24px]">picture_as_pdf</span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-700 text-xs truncate" title={g.title}>{g.title}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{g.file_name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(g.id, g.file_name)}
                        className="flex-shrink-0 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Unduh
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowPanduan(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
