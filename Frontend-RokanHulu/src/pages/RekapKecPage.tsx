import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";
import { useAuth } from "../state/AuthContext";
import CustomSelect from "../components/CustomSelect";


const SIAGA_STYLE: Record<string, { cls: string; label: string }> = {
  siaga1: { cls: "bg-red-500 text-white", label: "Siaga 1" },
  siaga2: { cls: "bg-orange-500 text-white", label: "Siaga 2" },
  siaga3: { cls: "bg-yellow-400 text-slate-900", label: "Siaga 3" },
  selesai: { cls: "bg-green-500 text-white", label: "Selesai" },
};
const JENIS_DOT: Record<string, string> = {
  banjir: "bg-blue-500", banjir_bandang: "bg-blue-700", tanah_longsor: "bg-orange-600",
  cuaca_ekstrim: "bg-sky-500", kekeringan: "bg-yellow-500", karhutla: "bg-red-600",
  wabah: "bg-purple-600", gempa_bumi: "bg-slate-600", konflik_sosial: "bg-pink-600",
};

const ALL_JENIS = [
  "banjir", "banjir_bandang", "tanah_longsor", "cuaca_ekstrim",
  "kekeringan", "karhutla", "wabah", "gempa_bumi", "konflik_sosial"
];

export default function RekapKecPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterJenis, setFilterJenis] = useState("semua");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [searchVal, setSearchVal] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const handleSearchSubmit = () => {
    setAppliedSearch(searchVal);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchVal("");
    setAppliedSearch("");
    setCurrentPage(1);
  };

  const [statusModal, setStatusModal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("siaga3");
  const [updateNotes, setUpdateNotes] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: laporanRaw = [], isLoading } = useQuery({
    queryKey: ["rekap-kecamatan"],
    queryFn: async () => {
      const { data } = await api.get("/rekap/kecamatan");
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
  });

  const laporan = (laporanRaw as any[]).map((item) => ({
    ...item,
    jenis_bencana: item.jenis_bencana ?? "tidak_diketahui",
    status: item.status ?? "siaga3",
  }));

  const toLocalDateString = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const filtered = laporan.filter((item) => {
    if (filterJenis !== "semua" && item.jenis_bencana !== filterJenis) return false;
    const itemLocalDate = toLocalDateString(item.waktu_kejadian);
    if (tanggalDari && itemLocalDate < tanggalDari) return false;
    if (tanggalSampai && itemLocalDate > tanggalSampai) return false;
    if (appliedSearch) {
      const q = appliedSearch.toLowerCase();
      const pelapor = String(item.nama_pelapor || "").toLowerCase();
      const kecamatan = String(item.nama_kecamatan || "").toLowerCase();
      const jenis = String(item.jenis_bencana || "").replace(/_/g, " ").toLowerCase();
      const statusLabel = String(SIAGA_STYLE[item.status]?.label ?? item.status).toLowerCase();
      const match = pelapor.includes(q) || kecamatan.includes(q) || jenis.includes(q) || statusLabel.includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Reset pagination when filters change
  useEffect(() => { setCurrentPage(1); }, [filterJenis, tanggalDari, tanggalSampai, appliedSearch]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDeleteClick = (item: any) => {
    setDeleteModal(item);
  };

  const executeDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await api.delete(`/laporan/${deleteModal.id}`);
      queryClient.invalidateQueries({ queryKey: ["rekap-kecamatan"] });
      alert("Laporan berhasil dipindahkan ke Recycle Bin");
      setDeleteModal(null);
    } catch (err: any) {
      alert("Gagal menghapus laporan: " + (err.response?.data?.error || err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal) return;
    setIsUpdatingStatus(true);
    try {
      const levelMap: Record<string, number> = { siaga1: 1, siaga2: 2, siaga3: 3, selesai: 0 };
      await api.put(`/laporan/${statusModal.id}`, {
        status: newStatus,
        severity_level: levelMap[newStatus] ?? 3,
        catatan_update: updateNotes,
      });
      queryClient.invalidateQueries({ queryKey: ["rekap-kecamatan"] });
      setStatusModal(null);
    } catch {
      alert("Gagal memperbarui status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };



  return (
    <div className="bg-[#F8F9FA] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <SipenaNav />
      <NewsTicker />
      <main className="mt-[104px] p-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Rekap Bencana Kecamatan</h1>
              <p className="text-slate-500 mt-1 text-sm">
                Wilayah: <strong className="text-amber-600">{user?.kecamatan_nama ?? "Semua Kecamatan"}</strong>
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-sm">
            {/* Pencarian Laporan */}
            <div className="mb-6 pb-6 border-b border-slate-200/60 flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pencarian Laporan</label>
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama pelapor, kecamatan, jenis bencana, atau status siaga..."
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-sm"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchSubmit();
                  }}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSearchSubmit}
                  className="flex-1 sm:flex-initial h-11 px-6 bg-[#1C1F2B] hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[20px]">search</span>
                  Cari
                </button>
                {appliedSearch && (
                  <button
                    onClick={handleClearSearch}
                    className="h-11 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold border border-slate-200 transition-colors flex items-center justify-center"
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Bencana</label>
                <div className="min-w-0">
                  <span className="block mb-1 text-[10px] font-bold text-transparent select-none uppercase tracking-wider">&nbsp;</span>
                  <CustomSelect
                    value={filterJenis}
                    onChange={setFilterJenis}
                    borderClass="border border-slate-200"
                    placeholder="Semua Jenis"
                    options={[
                      { value: "semua", label: "Semua Jenis" },
                      ...ALL_JENIS.map((j) => ({ value: j, label: j.replace(/_/g, " ") }))
                    ]}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Periode</label>
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
                  <div className="min-w-0">
                    <span className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dari Tanggal</span>
                    <input type="date" className="min-w-0 w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" 
                           value={tanggalDari} max={tanggalSampai || undefined} 
                           onChange={(e) => setTanggalDari(e.target.value)} />
                  </div>
                  <span className="hidden sm:flex h-11 items-center justify-center text-slate-400 text-xs font-bold px-1">s/d</span>
                  <div className="min-w-0">
                    <span className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sampai Tanggal</span>
                    <input type="date" className="min-w-0 w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" 
                           value={tanggalSampai} min={tanggalDari || undefined} 
                           onChange={(e) => setTanggalSampai(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Reset Filter Row */}
            <div className="flex justify-start mt-4">
              <button onClick={() => { setFilterJenis("semua"); setTanggalDari(""); setTanggalSampai(""); }}
                className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold border border-slate-200 transition-colors shadow-sm">
                Reset Filter
              </button>
            </div>
          </div>

          {/* Tabel (Desktop view) */}
          <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <div className="hidden md:block -mx-4 sm:mx-0 overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Tanggal", "Jenis Bencana", "Lokasi", "Pelapor", "Status Siaga", "Korban (LR/LB/M)", "Aksi"].map((h) => (
                    <th key={h} className={`px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${h === "Korban (LR/LB/M)" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-400">
                    <div className="animate-spin w-7 h-7 rounded-full border-4 border-amber-400 border-t-transparent mx-auto mb-2" />
                    Memuat data rekap...
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">search_off</span>
                    Tidak ada data laporan
                  </td></tr>
                ) : paginatedData.map((item: any) => {
                  const siaga = SIAGA_STYLE[item.status] ?? SIAGA_STYLE.siaga3;
                  return (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap font-mono text-sm text-slate-700">
                        {item.waktu_kejadian ? new Date(item.waktu_kejadian).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${JENIS_DOT[item.jenis_bencana] ?? "bg-slate-500"}`} />
                          <span className="font-medium text-slate-800 capitalize text-sm">{item.jenis_bencana?.replace(/_/g, " ")}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-sm max-w-[180px] truncate" title={item.lokasi_text ?? ""}>{item.lokasi_text ?? "-"}</td>
                      <td className="px-5 py-4 text-sm text-slate-700 max-w-[150px] truncate" title={item.nama_pelapor ?? ""}>{item.nama_pelapor ?? "-"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase ${siaga.cls}`}>
                            {siaga.label}
                          </span>
                          <button onClick={() => { setStatusModal(item); setNewStatus(item.status ?? "siaga3"); setUpdateNotes(item.catatan_update ?? ""); }}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 border border-blue-200 transition-all duration-200 hover:bg-blue-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(37,99,235,0.45)] flex items-center justify-center" title="Update Status">
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 bg-slate-50">
                        <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
                          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1 rounded bg-yellow-50 text-yellow-600 border border-yellow-200 font-bold" title="Luka Ringan">
                            {item.korban_luka_ringan ?? 0}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1 rounded bg-orange-50 text-orange-600 border border-orange-200 font-bold" title="Luka Berat">
                            {item.korban_luka_berat ?? 0}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1 rounded bg-red-50 text-red-600 border border-red-200 font-bold" title="Meninggal">
                            {item.korban_meninggal ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => navigate(`/detail/${item.id}`)} title="Lihat Detail"
                            className="p-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg transition-all duration-200 hover:bg-amber-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(217,119,6,0.4)] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button onClick={() => navigate(`/edit-detail/${item.id}`)} title="Edit Detail"
                            className="p-1.5 rounded-lg text-violet-600 bg-violet-50 border border-violet-200 transition-all duration-200 hover:bg-violet-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(124,58,237,0.45)] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                          </button>
                          <button onClick={() => handleDeleteClick(item)} title="Hapus Laporan (Pindahkan ke Recycle Bin)"
                            className="p-1.5 rounded-lg text-red-600 bg-red-50 border border-red-200 transition-all duration-200 hover:bg-red-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(220,38,38,0.45)] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards (Mobile view) */}
          <div className="block md:hidden space-y-4 p-4">
            {isLoading ? (
              <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <div className="animate-spin w-7 h-7 rounded-full border-4 border-amber-400 border-t-transparent mx-auto mb-2" />
                Memuat data...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">search_off</span>
                Tidak ada data
              </div>
            ) : (
              paginatedData.map((item: any) => {
                const siaga = SIAGA_STYLE[item.status] ?? SIAGA_STYLE.siaga3;
                const borderColors: Record<string, string> = {
                  banjir: "border-l-blue-500",
                  banjir_bandang: "border-l-blue-700",
                  tanah_longsor: "border-l-orange-600",
                  cuaca_ekstrim: "border-l-sky-500",
                  kekeringan: "border-l-yellow-500",
                  karhutla: "border-l-red-600",
                  wabah: "border-l-purple-600",
                  gempa_bumi: "border-l-slate-600",
                  konflik_sosial: "border-l-pink-600",
                };
                return (
                  <div
                    key={`card-kec-${item.id}`}
                    className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-l-4 ${borderColors[item.jenis_bencana] ?? "border-l-slate-400"}`}
                  >
                    {/* Top Header */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${JENIS_DOT[item.jenis_bencana] ?? "bg-slate-400"}`} />
                        <span className="font-bold text-slate-800 text-sm capitalize">
                          {item.jenis_bencana?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold uppercase leading-none ${siaga.cls}`}>
                        {siaga.label}
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mb-4">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      <span>
                        {item.waktu_kejadian ? new Date(item.waktu_kejadian).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"}
                      </span>
                    </div>

                    {/* 2-Column Info (Lokasi & Pelapor) */}
                    <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-3 mb-3 text-center sm:text-left">
                      <div className="min-w-0">
                        <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-400 mb-0.5">
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider">Lokasi</span>
                        </div>
                        <span className="font-bold text-slate-700 text-xs block truncate" title={item.lokasi_text ?? ""}>
                          {item.lokasi_text ?? "-"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-center sm:justify-start gap-1 text-slate-400 mb-0.5">
                          <span className="material-symbols-outlined text-[13px]">person</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider">Pelapor</span>
                        </div>
                        <span className="font-bold text-slate-700 text-xs block truncate" title={item.nama_pelapor ?? ""}>
                          {item.nama_pelapor ?? "-"}
                        </span>
                      </div>
                    </div>

                    {/* Victims pill boxes */}
                    <div className="flex items-center justify-center gap-2 mb-4 bg-slate-50 py-2 rounded-xl border border-slate-100">
                      <div className="bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-lg px-3 py-1 flex flex-col items-center min-w-[56px]" title="Luka Ringan">
                        <span className="text-[8px] font-bold uppercase">LR</span>
                        <span className="font-mono font-bold text-xs">{item.korban_luka_ringan ?? 0}</span>
                      </div>
                      <div className="bg-orange-50 text-orange-600 border border-orange-200 rounded-lg px-3 py-1 flex flex-col items-center min-w-[56px]" title="Luka Berat">
                        <span className="text-[8px] font-bold uppercase">LB</span>
                        <span className="font-mono font-bold text-xs">{item.korban_luka_berat ?? 0}</span>
                      </div>
                      <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-1 flex flex-col items-center min-w-[56px]" title="Meninggal">
                        <span className="text-[8px] font-bold uppercase">M</span>
                        <span className="font-mono font-bold text-xs">{item.korban_meninggal ?? 0}</span>
                      </div>
                    </div>

                    {/* Bottom actions row */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => navigate(`/detail/${item.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        Detail
                      </button>
                      <button
                        onClick={() => navigate(`/edit-detail/${item.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit_note</span>
                        Edit
                      </button>
                      <button
                        onClick={() => { setStatusModal(item); setNewStatus(item.status ?? "siaga3"); setUpdateNotes(item.catatan_update ?? ""); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">update</span>
                        Status
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filtered.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Tampilkan:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                  </select>
                  <span className="text-xs text-slate-500 font-semibold">data</span>
                </div>
                <p className="text-xs text-slate-500">
                  Menampilkan <strong>{filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> hingga <strong>{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> dari <strong>{filtered.length}</strong> entri
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <span className="text-[11px] font-bold text-slate-600">
                  Hal {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Edit Status */}
      {statusModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Update Status Siaga</h2>
              <button onClick={() => setStatusModal(null)} className="text-slate-400 hover:text-red-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Laporan #{statusModal.id}</p>
                <p className="text-sm font-semibold text-slate-700">{statusModal.jenis_bencana?.replace(/_/g, " ").toUpperCase()}</p>
                <p className="text-xs text-slate-500">{statusModal.nama_kecamatan} — {statusModal.lokasi_text}</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Status Baru</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "siaga1", label: "Siaga 1", cls: "border-red-200 text-red-700 bg-red-50" },
                    { value: "siaga2", label: "Siaga 2", cls: "border-orange-200 text-orange-700 bg-orange-50" },
                    { value: "siaga3", label: "Siaga 3", cls: "border-yellow-200 text-yellow-700 bg-yellow-50" },
                    { value: "selesai", label: "Selesai", cls: "border-green-200 text-green-700 bg-green-50" },
                  ].map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer text-sm font-bold transition-all ${newStatus === opt.value ? opt.cls + " ring-2 ring-offset-1" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      <input type="radio" name="status" value={opt.value} checked={newStatus === opt.value} onChange={e => setNewStatus(e.target.value)} className="sr-only" />
                      <span className={`w-3 h-3 rounded-full border-2 ${newStatus === opt.value ? "border-current bg-current" : "border-slate-300"}`} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Catatan Update</label>
                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none resize-none h-20"
                  value={updateNotes} onChange={e => setUpdateNotes(e.target.value)} placeholder="Tambahkan keterangan opsional..." />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setStatusModal(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isUpdatingStatus} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-[#1C1F2B] hover:bg-slate-800 shadow-md disabled:opacity-60 flex justify-center items-center gap-2">
                  {isUpdatingStatus ? <div className="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent" /> : null}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Delete (Soft Delete / Pindah ke Recycle Bin) */}
      {deleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
              <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                Hapus Laporan
              </h2>
              <button onClick={() => setDeleteModal(null)} className="text-red-400 hover:text-red-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Anda akan memindahkan laporan ini ke tempat sampah / Recycle Bin. Laporan dapat dipulihkan kembali oleh Admin Kabupaten melalui halaman Log Aktivitas.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Laporan #{deleteModal.id}</p>
                <p className="text-sm font-semibold text-slate-700">{deleteModal.jenis_bencana?.replace(/_/g, " ").toUpperCase()}</p>
                <p className="text-xs text-slate-500">{deleteModal.nama_kecamatan}</p>
                <p className="text-xs text-slate-500 mt-1">Tgl Kejadian: {new Date(deleteModal.waktu_kejadian).toLocaleString('id-ID')}</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50">Batal</button>
                <button type="button" onClick={executeDelete} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-md disabled:opacity-60 flex justify-center items-center gap-2">
                  {isDeleting ? <div className="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent" /> : null}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
