import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";
import { useAuth } from "../state/AuthContext";
import CustomSelect from "../components/CustomSelect";

const ACTION_BADGES: Record<string, { label: string; cls: string }> = {
  login: { label: "Login", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  logout: { label: "Logout", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  create_user: { label: "Buat Pengguna", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  update_user: { label: "Update Pengguna", cls: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  delete_user: { label: "Hapus Pengguna", cls: "bg-rose-100 text-rose-800 border-rose-200" },
  toggle_active_user: { label: "Status Pengguna", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  create_report: { label: "Buat Laporan", cls: "bg-teal-100 text-teal-800 border-teal-200" },
  update_report: { label: "Update Laporan", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  delete_report: { label: "Buat Sampah", cls: "bg-orange-100 text-orange-800 border-orange-200" },
  restore_report: { label: "Pulihkan Laporan", cls: "bg-green-100 text-green-800 border-green-200" },
  permanent_delete_report: { label: "Hapus Permanen", cls: "bg-red-100 text-red-800 border-red-200" },
  change_password: { label: "Ganti Password", cls: "bg-violet-100 text-violet-800 border-violet-200" },
};

export default function LogAktivitasPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"logs" | "trash">("logs");

  // Log filter states
  const [searchLog, setSearchLog] = useState("");
  const [filterAction, setFilterAction] = useState("semua");
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 25;

  // Trash filter states
  const [searchTrash, setSearchTrash] = useState("");
  const [filterBencana, setFilterBencana] = useState("semua");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [trashPage, setTrashPage] = useState(1);
  const trashPerPage = 20;

  const [actionLoading, setActionLoading] = useState(false);

  // Check role authorization: only Admin Kabupaten (admin / admin_kab)
  useEffect(() => {
    if (role && role !== "admin" && role !== "admin_kab") {
      alert("Akses ditolak. Halaman ini hanya untuk Administrator.");
      navigate("/dashboard");
    }
  }, [role, navigate]);

  // Fetch activity logs
  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => {
      const { data } = await api.get("/admin/activity-logs");
      return data;
    },
    enabled: role === "admin" || role === "admin_kab",
  });

  // Fetch soft-deleted reports (Recycle Bin)
  const { data: trashList = [], isLoading: loadingTrash } = useQuery({
    queryKey: ["admin-trash-laporan"],
    queryFn: async () => {
      const { data } = await api.get("/laporan?trash=true");
      return data;
    },
    enabled: role === "admin" || role === "admin_kab",
  });

  // Clean selected items if trash page changes / tab changes
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, trashPage]);

  // Reset pagination when filter changes
  useEffect(() => { setLogPage(1); }, [searchLog, filterAction]);
  useEffect(() => { setTrashPage(1); }, [searchTrash, filterBencana]);

  // Filtering Logs
  const filteredLogs = logs.filter((log: any) => {
    if (filterAction !== "semua" && log.aksi !== filterAction) return false;
    const name = String(log.user_name || "System").toLowerCase();
    const notes = String(log.catatan || "").toLowerCase();
    const actionLabel = String(ACTION_BADGES[log.aksi]?.label || log.aksi).toLowerCase();
    const q = searchLog.toLowerCase();
    return name.includes(q) || notes.includes(q) || actionLabel.includes(q) || String(log.ip_address).includes(q);
  });

  // Filtering Trash
  const filteredTrash = trashList.filter((item: any) => {
    if (filterBencana !== "semua" && item.jenis_bencana !== filterBencana) return false;
    const location = String(item.lokasi_text || "").toLowerCase();
    const reporter = String(item.nama_pelapor || "").toLowerCase();
    const kec = String(item.nama_kecamatan || "").toLowerCase();
    const idStr = String(item.id);
    const q = searchTrash.toLowerCase();
    return location.includes(q) || reporter.includes(q) || kec.includes(q) || idStr.includes(q);
  });

  // Log Pagination
  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

  // Trash Pagination
  const totalTrashPages = Math.ceil(filteredTrash.length / trashPerPage);
  const paginatedTrash = filteredTrash.slice((trashPage - 1) * trashPerPage, trashPage * trashPerPage);

  // Bulk selectors
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedTrash.map((item: any) => item.id);
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = paginatedTrash.map((item: any) => item.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const isAllSelectedOnPage = paginatedTrash.length > 0 && paginatedTrash.every((item: any) => selectedIds.includes(item.id));

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    type: "restore" | "force_delete" | "bulk_restore" | "bulk_force_delete";
    targetId?: number;
    title: string;
    message: string;
    isWarning?: boolean;
  } | null>(null);

  // Actions handlers
  const handleBulkRestore = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      show: true,
      type: "bulk_restore",
      title: "Pulihkan Laporan Terpilih",
      message: `Apakah Anda yakin ingin memulihkan ${selectedIds.length} laporan terpilih ke dashboard aktif?`,
    });
  };

  const handleBulkForceDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      show: true,
      type: "bulk_force_delete",
      title: "Hapus Permanen Laporan Terpilih",
      message: `⚠️ PERINGATAN: Anda akan menghapus secara PERMANEN ${selectedIds.length} laporan terpilih dari database! Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?`,
      isWarning: true,
    });
  };

  const handleSingleRestore = (id: number) => {
    setConfirmModal({
      show: true,
      type: "restore",
      targetId: id,
      title: "Pulihkan Laporan Bencana",
      message: "Apakah Anda yakin ingin memulihkan laporan bencana ini ke dashboard aktif?",
    });
  };

  const handleSingleForceDelete = (id: number) => {
    setConfirmModal({
      show: true,
      type: "force_delete",
      targetId: id,
      title: "Hapus Permanen Laporan Bencana",
      message: "⚠️ PERINGATAN: Anda akan menghapus laporan ini secara PERMANEN dari database! Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?",
      isWarning: true,
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmModal) return;
    const { type, targetId } = confirmModal;
    setActionLoading(true);
    setConfirmModal(null);
    try {
      if (type === "restore") {
        await api.post("/laporan/bulk-restore", { ids: [targetId] });
        alert("Laporan berhasil dipulihkan.");
        queryClient.invalidateQueries({ queryKey: ["admin-trash-laporan"] });
      } else if (type === "force_delete") {
        await api.post("/laporan/bulk-force-delete", { ids: [targetId] });
        alert("Laporan berhasil dihapus secara permanen.");
        queryClient.invalidateQueries({ queryKey: ["admin-trash-laporan"] });
      } else if (type === "bulk_restore") {
        await api.post("/laporan/bulk-restore", { ids: selectedIds });
        alert("Laporan terpilih berhasil dipulihkan.");
        setSelectedIds([]);
        queryClient.invalidateQueries({ queryKey: ["admin-trash-laporan"] });
      } else if (type === "bulk_force_delete") {
        await api.post("/laporan/bulk-force-delete", { ids: selectedIds });
        alert("Laporan terpilih berhasil dihapus secara permanen.");
        setSelectedIds([]);
        queryClient.invalidateQueries({ queryKey: ["admin-trash-laporan"] });
      }
    } catch (e: any) {
      alert("Aksi gagal: " + (e.response?.data?.error || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <SipenaNav />
      <NewsTicker />
      <main className="mt-[104px] p-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Log Aktivitas &amp; Keamanan</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Dashboard monitoring audit pengguna dan pemulihan data Recycle Bin Regional.
              </p>
            </div>
            {actionLoading && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 border border-amber-200 rounded-xl text-xs font-bold shadow-sm animate-pulse self-start sm:self-auto">
                <div className="animate-spin w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent" />
                <span>Memproses Aksi Massal...</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              onClick={() => setActiveTab("logs")}
              className={`pb-3 font-bold text-sm transition-all relative ${
                activeTab === "logs" ? "text-amber-500 font-extrabold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Log Audit Web
              {activeTab === "logs" && <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-amber-500" />}
            </button>
            <button
              onClick={() => setActiveTab("trash")}
              className={`pb-3 font-bold text-sm transition-all relative flex items-center gap-1.5 ${
                activeTab === "trash" ? "text-amber-500 font-extrabold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Recycle Bin (Tempat Sampah)
              {trashList.length > 0 && (
                <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none">
                  {trashList.length}
                </span>
              )}
              {activeTab === "trash" && <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-amber-500" />}
            </button>
          </div>

          {activeTab === "logs" ? (
            /* ================= LOG AUDIT TAB ================= */
            <div className="space-y-4">
              {/* Filter Row */}
              <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cari Aktivitas</label>
                  <input
                    type="text"
                    placeholder="Cari user, catatan, alamat IP..."
                    className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400"
                    value={searchLog}
                    onChange={(e) => setSearchLog(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jenis Aksi</label>
                  <CustomSelect
                    value={filterAction}
                    onChange={setFilterAction}
                    borderClass="border border-slate-200"
                    placeholder="Semua Aksi"
                    options={[
                      { value: "semua", label: "Semua Aksi" },
                      ...Object.entries(ACTION_BADGES).map(([k, v]) => ({ value: k, label: v.label }))
                    ]}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchLog("");
                      setFilterAction("semua");
                    }}
                    className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 transition-colors w-full md:w-auto"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[180px] whitespace-nowrap">Waktu Log</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[180px] whitespace-nowrap">Aktor / User</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[140px] whitespace-nowrap">Tipe Aksi</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap">Catatan Kegiatan</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[120px] whitespace-nowrap">Alamat IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingLogs ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <div className="animate-spin w-6 h-6 rounded-full border-4 border-amber-400 border-t-transparent mx-auto mb-2" />
                            Memuat log audit...
                          </td>
                        </tr>
                      ) : filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">search_off</span>
                            Tidak ditemukan data log audit
                          </td>
                        </tr>
                      ) : (
                        paginatedLogs.map((log: any) => {
                          const badge = ACTION_BADGES[log.aksi] ?? { label: log.aksi, cls: "bg-slate-100 text-slate-600" };
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/40 transition-colors text-sm">
                              <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                                {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "medium" })}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                                {log.user_name ? (
                                  <div>
                                    <p className="leading-tight">{log.user_name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">@{log.username} • {log.user_role}</p>
                                  </div>
                                ) : "System"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">{log.catatan}</td>
                              <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">{log.ip_address || "—"}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredLogs.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-4 text-xs font-semibold text-slate-600">
                    <p>Menampilkan <strong>{(logPage - 1) * logsPerPage + 1}</strong> hingga <strong>{Math.min(logPage * logsPerPage, filteredLogs.length)}</strong> dari <strong>{filteredLogs.length}</strong> entri</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLogPage(p => Math.max(1, p - 1))}
                        disabled={logPage === 1}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px] block">chevron_left</span>
                      </button>
                      <span>Hal {logPage} / {totalLogPages}</span>
                      <button
                        onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                        disabled={logPage === totalLogPages}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px] block">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ================= RECYCLE BIN TAB ================= */
            <div className="space-y-4">
              {/* Toolbar & Filter */}
              <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cari Laporan Terhapus</label>
                    <input
                      type="text"
                      placeholder="Cari ID, pelapor, lokasi, kecamatan..."
                      className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400"
                      value={searchTrash}
                      onChange={(e) => setSearchTrash(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jenis Bencana</label>
                    <CustomSelect
                      value={filterBencana}
                      onChange={setFilterBencana}
                      borderClass="border border-slate-200"
                      placeholder="Semua Jenis Bencana"
                      options={[
                        { value: "semua", label: "Semua Bencana" },
                        { value: "banjir", label: "Banjir" },
                        { value: "banjir_bandang", label: "Banjir Bandang" },
                        { value: "tanah_longsor", label: "Tanah Longsor" },
                        { value: "cuaca_ekstrim", label: "Cuaca Ekstrim" },
                        { value: "kekeringan", label: "Kekeringan" },
                        { value: "karhutla", label: "Karhutla" },
                        { value: "wabah", label: "Wabah Penyakit" },
                        { value: "gempa_bumi", label: "Gempa Bumi" },
                        { value: "konflik_sosial", label: "Konflik Sosial" }
                      ]}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkRestore}
                    disabled={selectedIds.length === 0 || actionLoading}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">settings_backup_restore</span>
                    Pulihkan ({selectedIds.length})
                  </button>
                  <button
                    onClick={handleBulkForceDelete}
                    disabled={selectedIds.length === 0 || actionLoading}
                    className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    Hapus Permanen ({selectedIds.length})
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <th className="px-4 py-3.5 w-12 text-center whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                            checked={isAllSelectedOnPage}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-16 whitespace-nowrap">ID</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[120px] whitespace-nowrap">Bencana</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[150px] whitespace-nowrap">Kecamatan</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[180px] whitespace-nowrap">Nama Pelapor</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap">Alamat / Lokasi</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[140px] whitespace-nowrap">Tanggal Hapus</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[150px] whitespace-nowrap">Dihapus Oleh</th>
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider w-[130px] text-center whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingTrash ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <div className="animate-spin w-6 h-6 rounded-full border-4 border-amber-400 border-t-transparent mx-auto mb-2" />
                            Memuat Recycle Bin...
                          </td>
                        </tr>
                      ) : filteredTrash.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">delete_outline</span>
                            Recycle Bin kosong
                          </td>
                        </tr>
                      ) : (
                        paginatedTrash.map((item: any) => (
                          <tr key={item.id} className={`hover:bg-red-50/10 transition-colors text-sm ${selectedIds.includes(item.id) ? "bg-amber-50/20" : ""}`}>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                                checked={selectedIds.includes(item.id)}
                                onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                              />
                            </td>
                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500 whitespace-nowrap">#{item.id}</td>
                            <td className="px-4 py-3 font-semibold text-slate-700 capitalize whitespace-nowrap">
                              {item.jenis_bencana?.replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">{item.nama_kecamatan}</td>
                            <td className="px-4 py-3 text-slate-600 font-semibold whitespace-nowrap">{item.nama_pelapor}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate" title={item.lokasi_text}>{item.lokasi_text}</td>
                            <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                              {item.deleted_at ? new Date(item.deleted_at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-150 px-2.5 py-1 rounded-full text-xs font-bold">
                                <span className="material-symbols-outlined text-xs">person</span>
                                {item.deleted_by_name ?? "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleSingleRestore(item.id)}
                                  title="Pulihkan Laporan"
                                  className="p-1.5 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all active:scale-95 flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-[18px]">settings_backup_restore</span>
                                </button>
                                <button
                                  onClick={() => handleSingleForceDelete(item.id)}
                                  title="Hapus Permanen"
                                  className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredTrash.length > 0 && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-4 text-xs font-semibold text-slate-600">
                    <p>Menampilkan <strong>{(trashPage - 1) * trashPerPage + 1}</strong> hingga <strong>{Math.min(trashPage * trashPerPage, filteredTrash.length)}</strong> dari <strong>{filteredTrash.length}</strong> entri</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTrashPage(p => Math.max(1, p - 1))}
                        disabled={trashPage === 1}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px] block">chevron_left</span>
                      </button>
                      <span>Hal {trashPage} / {totalTrashPages}</span>
                      <button
                        onClick={() => setTrashPage(p => Math.min(totalTrashPages, p + 1))}
                        disabled={trashPage === totalTrashPages}
                        className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px] block">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Custom Confirmation Web Modal (not browser confirm) */}
      {confirmModal && confirmModal.show && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-5 border-b border-slate-100 flex items-center justify-between ${confirmModal.isWarning ? "bg-red-50/50" : "bg-blue-50/50"}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${confirmModal.isWarning ? "text-red-600" : "text-blue-600"}`}>
                <span className="material-symbols-outlined">{confirmModal.isWarning ? "warning" : "help_center"}</span>
                {confirmModal.title}
              </h2>
              <button onClick={() => setConfirmModal(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeConfirmAction}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-white text-sm shadow-md transition-colors flex justify-center items-center gap-2 ${
                    confirmModal.isWarning ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  Ya, Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
