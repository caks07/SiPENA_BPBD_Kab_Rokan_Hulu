import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";
import { useAuth } from "../state/AuthContext";


const SIAGA_STYLE: Record<string, { cls: string; label: string }> = {
  siaga1: { cls: "bg-red-500 text-white",          label: "Siaga 1" },
  siaga2: { cls: "bg-orange-500 text-white",        label: "Siaga 2" },
  siaga3: { cls: "bg-yellow-400 text-slate-900",    label: "Siaga 3" },
  selesai:{ cls: "bg-green-500 text-white",         label: "Selesai" },
};
const JENIS_DOT: Record<string, string> = {
  banjir:"bg-blue-500", banjir_bandang:"bg-blue-700", tanah_longsor:"bg-orange-600",
  cuaca_ekstrim:"bg-sky-500", kekeringan:"bg-yellow-500", karhutla:"bg-red-600",
  wabah:"bg-purple-600", gempa_bumi:"bg-slate-600", konflik_sosial:"bg-pink-600",
};

const ALL_JENIS = [
  "banjir", "banjir_bandang", "tanah_longsor", "cuaca_ekstrim", 
  "kekeringan", "karhutla", "wabah", "gempa_bumi", "konflik_sosial"
];

export default function RekapKecPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterJenis,   setFilterJenis]   = useState("semua");
  const [tanggalDari,   setTanggalDari]   = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");

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

  const filtered = laporan.filter((item) => {
    if (filterJenis !== "semua" && item.jenis_bencana !== filterJenis) return false;
    if (tanggalDari  && new Date(item.waktu_kejadian) < new Date(tanggalDari))  return false;
    if (tanggalSampai && new Date(item.waktu_kejadian) > new Date(tanggalSampai)) return false;
    return true;
  });



  return (
    <div className="bg-[#F8F9FA] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <SipenaNav />
      <NewsTicker />
      <main className="mt-24 p-8 min-h-screen">
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
          <div className="p-4 rounded-xl flex flex-wrap items-end gap-4 bg-white border border-slate-200 shadow-sm">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jenis Bencana</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
                value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
                <option value="semua">Semua Jenis</option>
                {ALL_JENIS.map((j) => <option key={j} value={j}>{j.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dari Tanggal</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
                value={tanggalDari} max={tanggalSampai || undefined} onChange={(e) => setTanggalDari(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sampai Tanggal</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
                value={tanggalSampai} min={tanggalDari || undefined} onChange={(e) => setTanggalSampai(e.target.value)} />
            </div>
            <button onClick={() => { setFilterJenis("semua"); setTanggalDari(""); setTanggalSampai(""); }}
              className="px-5 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 text-sm">
              Reset
            </button>
          </div>

          {/* Tabel */}
          <div className="rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Tanggal","Jenis Bencana","Lokasi","Pelapor","Status Siaga","Korban (LR/LB/M)","Aksi"].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
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
                ) : filtered.map((item: any) => {
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
                      <td className="px-5 py-4 text-center font-mono text-sm bg-slate-50">
                        {item.korban_luka_ringan ?? 0} / {item.korban_luka_berat ?? 0} / <strong className="text-red-600">{item.korban_meninggal ?? 0}</strong>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => navigate(`/detail/${item.id}`)}
                          className="text-amber-600 hover:text-amber-800 transition-colors" title="Lihat Detail">
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  Menampilkan <strong>{filtered.length}</strong> dari <strong>{laporan.length}</strong> entri
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
