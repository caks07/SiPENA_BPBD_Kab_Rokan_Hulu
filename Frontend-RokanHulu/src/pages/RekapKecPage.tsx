import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";
import { useAuth } from "../state/AuthContext";
import { useEffect } from "react";
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
  const [filterJenis, setFilterJenis] = useState("semua");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

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
                        <span className="font-bold text-slate-700 text-xs block truncate">
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
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => navigate(`/detail/${item.id}`)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        Detail
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
    </div>
  );
}
