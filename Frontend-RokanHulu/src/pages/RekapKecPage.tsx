import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";
import { useAuth } from "../state/AuthContext";
import { useEffect } from "react";


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
  const [filterJenis, setFilterJenis] = useState("semua");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
    return true;
  });

  // Reset pagination when filters change
  useEffect(() => { setCurrentPage(1); }, [filterJenis, tanggalDari, tanggalSampai]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Bencana</label>
                <div className="min-w-0">
                  <span className="block mb-1 text-[10px] font-bold text-transparent select-none uppercase tracking-wider">&nbsp;</span>
                  <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
                    <option value="semua">Semua Jenis</option>
                    {ALL_JENIS.map((j) => <option key={j} value={j}>{j.replace(/_/g, " ")}</option>)}
                  </select>
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

          {/* Tabel */}
          <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <div className="-mx-4 sm:mx-0 overflow-x-auto">
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
                      <td className="px-5 py-4 text-slate-500 text-sm max-w-[180px] truncate">{item.lokasi_text ?? "-"}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{item.nama_pelapor ?? "-"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase ${siaga.cls}`}>
                          {siaga.label}
                        </span>
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
                        <button onClick={() => navigate(`/detail/${item.id}`)}
                          className="p-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg transition-all duration-200 hover:bg-amber-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(217,119,6,0.4)] flex items-center justify-center" title="Lihat Detail">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-xs text-slate-500">
                  Menampilkan <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> hingga <strong>{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> dari <strong>{filtered.length}</strong> entri
                </p>
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
    </div>
  );
}
