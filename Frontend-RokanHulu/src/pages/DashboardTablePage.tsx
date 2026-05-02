import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../state/AuthContext";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  siaga1:  { bg: "bg-red-100",    text: "text-red-800" },
  siaga2:  { bg: "bg-orange-100", text: "text-orange-800" },
  siaga3:  { bg: "bg-yellow-100", text: "text-yellow-800" },
  selesai: { bg: "bg-green-100",  text: "text-green-800" },
};
const STATUS_LABEL: Record<string, string> = {
  siaga1: "Siaga 1", siaga2: "Siaga 2", siaga3: "Siaga 3", selesai: "Selesai",
};

const JENIS_LABEL: Record<string, string> = {
  banjir: "Banjir", banjir_bandang: "Banjir Bandang", tanah_longsor: "Tanah Longsor",
  cuaca_ekstrim: "Cuaca Ekstrim", kekeringan: "Kekeringan", karhutla: "Karhutla",
  wabah: "Wabah", gempa_bumi: "Gempa Bumi", konflik_sosial: "Konflik Sosial",
};

export default function DashboardTablePage() {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");

  const { data: laporanRaw = [], isLoading } = useQuery({
    queryKey: ["laporan"],
    queryFn: async () => {
      const { data } = await api.get("/laporan");
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
  });

  // Normalisasi dan filter
  const laporan = (laporanRaw as any[]).map((item) => ({
    ...item,
    jenis_bencana: item.jenis_bencana ?? "tidak_diketahui",
    status: item.status ?? "baru",
  }));

  const filtered = laporan.filter((item) => {
    const matchStatus = filterStatus === "semua" || item.status === filterStatus;
    const matchSearch = !search ||
      item.jenis_bencana?.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_pelapor?.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_kecamatan?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: laporan.length,
    siaga1: laporan.filter((i) => i.status === "siaga1").length,
    siaga2: laporan.filter((i) => i.status === "siaga2").length,
    selesai: laporan.filter((i) => i.status === "selesai").length,
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ── TOPBAR NAV ──────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 shadow-md"
        style={{ background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-black text-sm tracking-widest uppercase">⬡ SiPENA</span>
          <span className="h-4 w-px bg-white/20" />
          <span className="text-slate-300 text-xs font-semibold">Dashboard Kecamatan</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-xs">{user?.name}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 uppercase">
            {role}
          </span>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Keluar
          </button>
        </div>
      </nav>
      
      <SipenaNav />
      <NewsTicker />

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="pt-28 pb-8 px-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Laporan Bencana</h1>
            <p className="text-slate-500 text-sm mt-1">
              Wilayah: <strong>{user?.kecamatan_nama ?? "Semua Kecamatan"}</strong>
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Laporan", value: stats.total,   color: "bg-slate-800",  icon: "article" },
            { label: "Siaga 1",       value: stats.siaga1,  color: "bg-red-500",    icon: "crisis_alert" },
            { label: "Siaga 2",       value: stats.siaga2,  color: "bg-orange-500", icon: "warning" },
            { label: "Selesai",       value: stats.selesai, color: "bg-green-600",  icon: "check_circle" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
              <div className={`${color} p-2.5 rounded-lg`}>
                <span className="material-symbols-outlined text-white text-xl">{icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Cari laporan (jenis, pelapor, kecamatan)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="semua">Semua Status</option>
            <option value="siaga1">Siaga 1 — Bahaya</option>
            <option value="siaga2">Siaga 2 — Siaga</option>
            <option value="siaga3">Siaga 3 — Waspada</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Memuat data laporan...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["#", "Jenis Bencana", "Waktu Kejadian", "Pelapor", "Kecamatan", "Status", "Aksi"].map((h) => (
                      <th key={h} className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block text-slate-300">search_off</span>
                        Tidak ada laporan yang sesuai
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item: any) => {
                      const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.baru;
                      return (
                        <tr key={item.id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="p-4 text-slate-400 font-mono text-xs">#{item.id}</td>
                          <td className="p-4">
                            <span className="font-semibold text-slate-800">
                              {JENIS_LABEL[item.jenis_bencana] ?? item.jenis_bencana?.replace(/_/g, " ") ?? "-"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 whitespace-nowrap">
                            {item.waktu_kejadian
                              ? new Date(item.waktu_kejadian).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                              : "-"}
                          </td>
                          <td className="p-4 text-slate-700">{item.nama_pelapor ?? "-"}</td>
                          <td className="p-4 text-slate-600">{item.nama_kecamatan ?? "-"}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${style.bg} ${style.text}`}>
                              {STATUS_LABEL[item.status] ?? item.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => navigate(`/detail/${item.id}`)}
                              className="text-amber-600 hover:text-amber-800 font-bold text-xs bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Detail →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
              Menampilkan {filtered.length} dari {laporan.length} laporan
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
