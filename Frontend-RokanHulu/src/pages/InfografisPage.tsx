import { useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as htmlToImage from "html-to-image";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const JENIS_COLORS: Record<string, string> = {
  banjir:"#3B82F6", banjir_bandang:"#1D4ED8", tanah_longsor:"#EA580C",
  cuaca_ekstrim:"#0EA5E9", kekeringan:"#EAB308", karhutla:"#EF4444",
  wabah:"#8B5CF6", gempa_bumi:"#64748B", konflik_sosial:"#EC4899",
};
const JENIS_LABEL: Record<string, string> = {
  banjir:"Banjir", banjir_bandang:"Banjir Bandang", tanah_longsor:"Tanah Longsor",
  cuaca_ekstrim:"Cuaca Ekstrim", kekeringan:"Kekeringan", karhutla:"Karhutla",
  wabah:"Wabah Penyakit", gempa_bumi:"Gempa Bumi", konflik_sosial:"Konflik Sosial",
};
const SIAGA_COLOR: Record<string, string> = {
  siaga1:"#EF4444", siaga2:"#F97316", siaga3:"#EAB308", selesai:"#22C55E",
};
const SIAGA_LABEL: Record<string, string> = {
  siaga1:"Siaga 1", siaga2:"Siaga 2", siaga3:"Siaga 3", selesai:"Selesai",
};

function DonutSVG({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) {
  const r = 66; const cx = 80; const cy = 80; const stroke = 24;
  let offset = 0;
  const circ = 2 * Math.PI * r;
  const nonZero = data.filter(d => d.value > 0);
  const slices = nonZero.map(d => {
    const pct = total > 0 ? d.value / total : 0;
    const dash = pct * circ;
    const s = { offset, dash, color: d.color, label: d.label, value: d.value };
    offset += dash;
    return s;
  });
  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-black text-slate-800 leading-none">{total}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total</p>
      </div>
    </div>
  );
}

export default function InfografisPage() {
  const [filterJenis, setFilterJenis] = useState("semua");
  const [filterKec, setFilterKec] = useState("semua");
  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");

  const { data: kecamatans = [] } = useQuery({ queryKey: ["kecamatan"], queryFn: async () => { const { data } = await api.get("/kecamatan"); return data; } });
  const { data: laporanRaw = [], isLoading } = useQuery({ queryKey: ["laporan-all"], queryFn: async () => { const { data } = await api.get("/laporan"); return data; } });

  const toLocalDateString = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  const laporan = useMemo(() => laporanRaw.filter((item: any) => {
    if (filterJenis !== "semua" && item.jenis_bencana !== filterJenis) return false;
    if (filterKec !== "semua" && item.kecamatan_id !== parseInt(filterKec)) return false;
    const itemLocalDate = toLocalDateString(item.waktu_kejadian);
    if (filterDari && itemLocalDate < filterDari) return false;
    if (filterSampai && itemLocalDate > filterSampai) return false;
    return true;
  }), [laporanRaw, filterJenis, filterKec, filterDari, filterSampai]);

  const total = laporan.length;
  const tanggalTerawal = useMemo(() => {
    if (laporan.length === 0) return null;
    const dates = laporan
      .map((item: any) => item.waktu_kejadian ? new Date(item.waktu_kejadian).getTime() : null)
      .filter((t: number | null): t is number => t !== null && !isNaN(t));
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates));
  }, [laporan]);

  const displayDari = useMemo(() => {
    if (filterDari) return new Date(filterDari).toLocaleDateString('id-ID');
    if (tanggalTerawal && !isNaN(tanggalTerawal.getTime())) {
      return tanggalTerawal.toLocaleDateString('id-ID');
    }
    return "Awal";
  }, [filterDari, tanggalTerawal]);

  const totalMeninggal = laporan.reduce((s: number, i: any) => s + (i.korban_meninggal ?? 0), 0);
  const totalMengungsi = laporan.reduce((s: number, i: any) => s + (i.jiwa_mengungsi ?? 0), 0);
  const totalLukaRingan = laporan.reduce((s: number, i: any) => s + (i.korban_luka_ringan ?? 0), 0);
  const totalLukaBerat = laporan.reduce((s: number, i: any) => s + (i.korban_luka_berat ?? 0), 0);
  const totalHilang = laporan.reduce((s: number, i: any) => s + (i.korban_hilang ?? 0), 0);
  const totalKkMengungsi = laporan.reduce((s: number, i: any) => s + (i.kk_mengungsi ?? 0), 0);
  
  const rusakBerat = laporan.reduce((s: number, i: any) => s + (i.rumah_rusak_berat ?? 0), 0);
  const rusakSedang = laporan.reduce((s: number, i: any) => s + (i.rumah_rusak_sedang ?? 0), 0);
  const rusakRingan = laporan.reduce((s: number, i: any) => s + (i.rumah_rusak_ringan ?? 0), 0);
  const totalRumah = rusakBerat + rusakSedang + rusakRingan;
  
  const byFasilitas = useMemo(() => {
    const acc: Record<string, number> = {};
    laporan.forEach((i: any) => {
      let fArr: string[] = [];
      if (Array.isArray(i.fasilitas_terdampak)) {
        fArr = i.fasilitas_terdampak;
      } else if (typeof i.fasilitas_terdampak === "string") {
        try {
          fArr = JSON.parse(i.fasilitas_terdampak);
        } catch (e) {}
      }
      fArr.forEach(f => {
        acc[f] = (acc[f] ?? 0) + 1;
      });
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [laporan]);

  const byJenis = Object.entries(laporan.reduce((acc: Record<string, number>, i: any) => {
    acc[i.jenis_bencana] = (acc[i.jenis_bencana] ?? 0) + 1; return acc;
  }, {})).map(([k, v]) => ({ label: JENIS_LABEL[k] ?? k, value: v as number, color: JENIS_COLORS[k] ?? "#94A3B8" })).sort((a, b) => b.value - a.value);

  const severityMap: Record<string, number> = { "Siaga 1": 1, "Siaga 2": 2, "Siaga 3": 3, "Selesai": 4 };
  const byStatus = Object.entries(laporan.reduce((acc: Record<string, number>, i: any) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1; return acc;
  }, {})).map(([k, v]) => ({ label: SIAGA_LABEL[k] ?? k, value: v as number, color: SIAGA_COLOR[k] ?? "#94A3B8" })).sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return (severityMap[a.label] || 99) - (severityMap[b.label] || 99);
  });

  const byKec = Object.entries(laporan.reduce((acc: Record<string, number>, i: any) => {
    const kec = i.nama_kecamatan ?? "Tidak diketahui"; acc[kec] = (acc[kec] ?? 0) + 1; return acc;
  }, {})).map(([k, v]) => ({ label: k, value: v as number })).sort((a, b) => b.value - a.value).slice(0, 8);
  const maxKec = byKec.length > 0 ? byKec[0].value : 1;

  const monthMap: Record<string, number> = {};
  laporan.forEach((item: any) => {
    if (!item.waktu_kejadian) return;
    const d = new Date(item.waktu_kejadian);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] ?? 0) + 1;
  });
  const perBulan = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => { 
       const [y, m] = k.split("-"); 
       const date = new Date(parseInt(y), parseInt(m)-1); 
       return { 
         label: date.toLocaleString('id-ID', { month: 'short', year: 'numeric' }), 
         value: v as number 
       }; 
    });

  const chartData = useMemo(() => ({
    labels: perBulan.map(d => d.label),
    datasets: [
      {
        label: "Kejadian",
        data: perBulan.map(d => d.value),
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#F59E0B",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }), [perBulan]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1E293B",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.parsed.y} Kejadian`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0, color: "#94A3B8" }, grid: { color: "#F1F5F9" } },
      x: { ticks: { color: "#64748B", font: { weight: "bold" as const } }, grid: { display: false } },
    },
  }), []);

  const statusDominan = byStatus.length > 0 ? byStatus[0].label : "-";

  const chartRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleScreenshot = async () => {
    if (!chartRef.current) return;
    setIsCapturing(true);
    try {
      await document.fonts.ready;
      chartRef.current.classList.add("capture-mode");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await htmlToImage.toPng(chartRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });
      
      const link = document.createElement("a");
      link.download = `infografis_bencana_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Screenshot error:", e);
      alert("Gagal mengambil screenshot. " + String(e));
    } finally {
      if (chartRef.current) chartRef.current.classList.remove("capture-mode");
      setIsCapturing(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <SipenaNav />
      <NewsTicker />

      {/* Global style injection to clear box-shadow and text-shadow during capture */}
      <style>{`
        .capture-mode * {
          box-shadow: none !important;
          text-shadow: none !important;
        }
        .capture-mode {
          width: 1200px !important;
          min-width: 1200px !important;
          max-width: 1200px !important;
          box-sizing: border-box !important;
          padding: 32px !important;
        }
        .capture-mode .kpi-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        }
        .capture-mode .dist-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        .capture-mode .dampak-tren-grid {
          grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
        }
        .capture-mode .dampak-col {
          grid-column: span 7 / span 7 !important;
        }
        .capture-mode .tren-col {
          grid-column: span 5 / span 5 !important;
        }
        .capture-mode .korban-grid {
          grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
        }
        .capture-mode .korban-grid > div:last-child {
          grid-column: span 1 / span 1 !important;
        }
        .capture-mode .rumah-fasilitas-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      `}</style>

      <main className="pt-32 pb-16 px-4 max-w-[1200px] mx-auto">
        {/* Top Control Bar (Not Captured) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col gap-6">
            {/* Filter inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kecamatan</label>
                <div className="min-w-0">
                  <span className="block mb-1 text-[10px] font-bold text-transparent select-none uppercase tracking-wider">&nbsp;</span>
                  <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" value={filterKec} onChange={e => setFilterKec(e.target.value)}>
                    <option value="semua">Semua Kecamatan</option>
                    {kecamatans.map((k:any) => <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Bencana</label>
                <div className="min-w-0">
                  <span className="block mb-1 text-[10px] font-bold text-transparent select-none uppercase tracking-wider">&nbsp;</span>
                  <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400" value={filterJenis} onChange={e => setFilterJenis(e.target.value)}>
                    <option value="semua">Semua Bencana</option>
                    {Object.entries(JENIS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Periode</label>
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
                  <div className="min-w-0">
                    <span className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dari Tanggal</span>
                    <input
                      type="date"
                      max={filterSampai || undefined}
                      className="min-w-0 w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      value={filterDari}
                      onChange={e => {
                        const val = e.target.value;
                        setFilterDari(val);
                        if (filterSampai && val > filterSampai) {
                          setFilterSampai(val);
                        }
                      }}
                    />
                  </div>
                  <span className="hidden sm:flex h-11 items-center justify-center text-slate-400 text-xs font-bold px-1">s/d</span>
                  <div className="min-w-0">
                    <span className="block mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sampai Tanggal</span>
                    <input
                      type="date"
                      min={filterDari || undefined}
                      className="min-w-0 w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      value={filterSampai}
                      onChange={e => {
                        const val = e.target.value;
                        setFilterSampai(val);
                        if (filterDari && val < filterDari) {
                          setFilterDari(val);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions & Reset Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200 mt-2">
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setFilterJenis("semua");
                    setFilterKec("semua");
                    setFilterDari("");
                    setFilterSampai("");
                  }}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold border border-slate-200 transition-colors shadow-sm"
                >
                  Reset Filter
                </button>
                <div className="text-xs text-slate-400 font-medium leading-relaxed hidden md:block">
                  * Gunakan filter di atas untuk menganalisis infografis kebencanaan.
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <button onClick={handleScreenshot} disabled={isCapturing}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 text-white px-5 h-11 rounded-xl font-bold hover:bg-amber-600 text-sm shadow-md disabled:opacity-60 whitespace-nowrap transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{isCapturing ? "hourglass_top" : "photo_camera"}</span>
                  Screenshot
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full" /></div>
        ) : (
          <div ref={chartRef} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 shadow-sm">
            {/* SECTION 1: HEADER */}
            <div className="border-b border-slate-200 pb-5 mb-8 flex items-center justify-between">
              <div>
                <p className="text-amber-500 font-bold text-xs tracking-widest uppercase mb-1">SIPENA — BPBD ROKAN HULU</p>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Infografis Kejadian Bencana</h1>
                <p className="text-slate-500 mt-1">Periode: {displayDari} s.d {filterSampai ? new Date(filterSampai).toLocaleDateString('id-ID') : "Hari Ini"}</p>
              </div>
            </div>

            {/* SECTION 2: KPI UTAMA */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 kpi-grid">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 border-l-4 border-l-amber-500">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Kejadian</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-800">{total}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 border-l-4 border-l-blue-500">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Titik Terdampak</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-800">{byKec.length} <span className="text-sm text-slate-400">Kec</span></p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 border-l-4 border-l-red-500">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Korban</p>
                <p className="text-3xl sm:text-4xl font-black text-slate-800">{totalMeninggal + totalLukaRingan + totalLukaBerat + totalMengungsi}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 border-l-4 border-l-emerald-500">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status Dominan</p>
                <p className="text-2xl sm:text-3xl font-black text-slate-800 break-words leading-tight mt-1">{statusDominan}</p>
              </div>
            </div>

            {/* SECTION 3: DISTRIBUSI DATA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 dist-grid">
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center">
                <h3 className="font-bold text-slate-700 mb-6 text-sm uppercase tracking-wider self-start">Jenis Bencana</h3>
                <DonutSVG data={byJenis} total={total} />
                <div className="mt-6 grid grid-cols-2 gap-2 w-full">
                  {byJenis.slice(0,6).map((d,i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></span>
                      <span className="text-slate-600 truncate">{d.label}</span>
                      <span className="ml-auto font-bold text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center">
                <h3 className="font-bold text-slate-700 mb-6 text-sm uppercase tracking-wider self-start">Status Siaga</h3>
                <DonutSVG data={byStatus} total={total} />
                <div className="mt-6 grid grid-cols-2 gap-2 w-full">
                  {byStatus.map((d,i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></span>
                      <span className="text-slate-600 truncate">{d.label}</span>
                      <span className="ml-auto font-bold text-slate-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Top Kecamatan</h3>
                <div className="flex flex-col gap-3 mt-2 h-full justify-center">
                  {byKec.map(k => (
                    <div key={k.label} className="flex items-center gap-3">
                      <div className="w-24 text-[10px] text-right font-bold text-slate-600 uppercase truncate">{k.label}</div>
                      <div className="flex-1 bg-slate-100 h-4 rounded overflow-hidden">
                        <div className="bg-amber-500 h-full rounded" style={{ width: `${(k.value / maxKec) * 100}%` }} />
                      </div>
                      <div className="w-6 text-xs font-black text-slate-800">{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 4 & 5: DAMPAK & TREN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 dampak-tren-grid">
              
              {/* Kolom Kiri: Group Dampak */}
              <div className="lg:col-span-7 flex flex-col gap-6 dampak-col">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Dampak Bencana</h3>
                
                {/* A. Group Korban */}
                <div className="bg-white border border-slate-200 p-5 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                    <span className="material-symbols-outlined text-red-500">group</span>
                    <h4 className="font-bold text-slate-800 text-sm uppercase">Korban Jiwa</h4>
                  </div>
                  
                  {/* Row 1 (Highlight Utama) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3 korban-grid">
                    <div className="bg-red-50/50 border border-red-100 p-3 rounded-lg text-center flex flex-col justify-center">
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1">Meninggal</p>
                      <p className="text-xl font-black text-red-600">{totalMeninggal}</p>
                    </div>
                    <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-lg text-center flex flex-col justify-center">
                      <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1 leading-tight">Luka Ringan</p>
                      <p className="text-xl font-black text-orange-600">{totalLukaRingan}</p>
                    </div>
                    <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-lg text-center flex flex-col justify-center">
                      <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-1 leading-tight">Luka Berat</p>
                      <p className="text-xl font-black text-orange-600">{totalLukaBerat}</p>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-center flex flex-col justify-center">
                      <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">Mengungsi</p>
                      <p className="text-xl font-black text-blue-600">{totalMengungsi}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center flex flex-col justify-center col-span-2 sm:col-span-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Hilang</p>
                      <p className="text-xl font-black text-slate-700">{totalHilang}</p>
                    </div>
                  </div>

                  {/* Row 2 (Detail Tambahan) */}
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                    <div className="bg-blue-50/30 border border-blue-100 p-3 rounded-lg flex justify-center items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-blue-400">family_restroom</span>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">KK Mengungsi:</p>
                      <p className="text-lg font-black text-blue-700 ml-2">{totalKkMengungsi} <span className="text-xs font-bold text-blue-500">KK</span></p>
                    </div>
                  </div>
                </div>

                {/* B & C: Rumah & Fasilitas (Side by side on larger screens) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rumah-fasilitas-grid">
                  {/* B. Group Rumah */}
                  <div className="bg-white border border-slate-200 p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                      <span className="material-symbols-outlined text-amber-500">house</span>
                      <h4 className="font-bold text-slate-800 text-sm uppercase">Kerusakan Rumah</h4>
                    </div>
                    <div className="flex items-end items-center gap-3 mb-4">
                      <span className="text-3xl font-black text-slate-800">{totalRumah}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-1">Total Unit</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span>Rusak Berat</span>
                        <span className="font-bold text-slate-700">{rusakBerat}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400"></span>Rusak Sedang</span>
                        <span className="font-bold text-slate-700">{rusakSedang}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>Rusak Ringan</span>
                        <span className="font-bold text-slate-700">{rusakRingan}</span>
                      </div>
                    </div>
                  </div>

                  {/* C. Group Fasilitas */}
                  <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col max-h-[300px]">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                      <span className="material-symbols-outlined text-emerald-500">domain</span>
                      <h4 className="font-bold text-slate-800 text-sm uppercase">Fasilitas Terdampak</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {byFasilitas.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2 content-start">
                          {byFasilitas.map(([label, count], i) => (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex justify-between items-center">
                              <span className="text-xs text-slate-600 font-bold uppercase truncate" title={label}>{label}</span>
                              <span className="text-lg font-black text-slate-700 leading-none">{count}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-sm text-slate-400 italic">
                          Tidak ada data fasilitas
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Kolom Kanan: Tren Bencana */}
              <div className="lg:col-span-5 flex flex-col gap-6 tren-col">
                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Tren Kejadian Bencana</h3>
                <div className="bg-white border border-slate-200 p-5 rounded-xl flex-1 flex flex-col">
                  <div className="flex-1 min-h-[250px] relative w-full">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
