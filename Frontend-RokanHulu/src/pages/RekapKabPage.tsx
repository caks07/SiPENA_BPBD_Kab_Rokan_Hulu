import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";
import { useAuth } from "../state/AuthContext";
import { generatePdfReport, FIELD_OPT_KEYS, resolveLabel } from "../utils/pdfExport";
import * as htmlToImage from "html-to-image";

const SIAGA_CLS: Record<string, string> = {
  siaga1: "bg-red-500 text-white",
  siaga2: "bg-orange-500 text-white",
  siaga3: "bg-yellow-400 text-slate-900",
  selesai: "bg-green-500 text-white",
};
const SIAGA_LABEL: Record<string, string> = {
  siaga1: "Siaga 1", siaga2: "Siaga 2", siaga3: "Siaga 3", selesai: "Selesai",
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

export default function RekapKabPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [filterKecamatan, setFilterKecamatan] = useState("semua");
  const [filterJenis, setFilterJenis] = useState("semua");
  const [filterSiaga, setFilterSiaga] = useState("semua");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const queryClient = useQueryClient();
  const [statusModal, setStatusModal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("siaga3");
  const [updateNotes, setUpdateNotes] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: laporanRaw = [], isLoading } = useQuery({
    queryKey: ["rekap-kabupaten-detail"],
    queryFn: async () => {
      const { data } = await api.get("/laporan");
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
  });

  const { data: kecamatans = [] } = useQuery({
    queryKey: ["kecamatan-list"],
    queryFn: async () => { const { data } = await api.get("/kecamatan"); return data as { id: number; nama_kecamatan: string }[]; },
  });

  const laporan = (laporanRaw as any[]).map((item) => ({
    ...item,
    jenis_bencana: item.jenis_bencana ?? "tidak_diketahui",
    status: item.status ?? "siaga3",
  }));

  const filtered = laporan.filter((item) => {
    if (filterKecamatan !== "semua" && String(item.kecamatan_id) !== filterKecamatan) return false;
    if (filterJenis !== "semua" && item.jenis_bencana !== filterJenis) return false;
    if (filterSiaga !== "semua" && item.status !== filterSiaga) return false;
    if (tanggalDari && new Date(item.waktu_kejadian) < new Date(tanggalDari)) return false;
    if (tanggalSampai && new Date(item.waktu_kejadian) > new Date(tanggalSampai + "T23:59:59")) return false;
    return true;
  });

  // Reset pagination when filters change
  useEffect(() => { setCurrentPage(1); }, [filterKecamatan, filterJenis, filterSiaga, tanggalDari, tanggalSampai]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const uniqueJenis = [...new Set(laporan.map((i) => i.jenis_bencana))];

  /* ── Export Excel Lengkap (fetch detail per laporan) ── */
  const [isExporting, setIsExporting] = useState(false);
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const optionsCache: Record<string, any> = {};
      const details = await Promise.all(
        filtered.map(async (item: any) => {
          try {
            const { data } = await api.get(`/laporan/${item.id}`);
            if (item.jenis_bencana && !optionsCache[item.jenis_bencana]) {
              try {
                const res = await api.get(`/options/${item.jenis_bencana}`);
                optionsCache[item.jenis_bencana] = res.data;
              } catch { }
            }
            return { lb: data, options: optionsCache[item.jenis_bencana] };
          } catch { return { lb: item, options: null }; }
        })
      );

      const rows = details.map(({ lb, options }: any, i: number) => {
        // Step 2: stringify detail bencana menjadi 1 kolom
        const fieldMap = lb.jenis_bencana ? FIELD_OPT_KEYS[lb.jenis_bencana] ?? {} : {};
        const detailStr = lb.detail
          ? Object.entries(lb.detail)
            .filter(([k]) => !["laporan_id", "created_at", "updated_at"].includes(k))
            .map(([k, v]) => {
              const optKey = fieldMap[k] ?? null;
              const label = resolveLabel(v, optKey, options);
              const displayKey = k.replace(/_ids?$/, "").replace(/_/g, " ").toUpperCase();
              return `${displayKey}: ${label}`;
            })
            .filter(s => !s.endsWith(": -") && !s.endsWith(": null") && !s.endsWith(": "))
            .join("; ")
          : "-";

        return {
          // Step 1 — Identitas
          "No": i + 1,
          "ID Laporan": lb.id,
          "Tanggal Kejadian": lb.waktu_kejadian ? new Date(lb.waktu_kejadian).toLocaleString("id-ID") : "-",
          "Tanggal Dibuat": lb.created_at ? new Date(lb.created_at).toLocaleString("id-ID") : "-",
          "Jenis Bencana": lb.jenis_bencana?.replace(/_/g, " ") ?? "-",
          "Nama Pelapor": lb.nama_pelapor ?? "-",
          "Sumber Laporan": lb.sumber_laporan ?? "-",
          "Kecamatan": lb.nama_kecamatan ?? "-",
          "Lokasi Teks": lb.lokasi_text ?? "-",
          "Latitude": lb.latitude ?? "-",
          "Longitude": lb.longitude ?? "-",
          "Status Siaga": SIAGA_LABEL[lb.status] ?? lb.status ?? "-",

          // Step 2 — Detail Bencana (stringify)
          "Detail Bencana": detailStr,

          // Step 3 — Korban
          "Luka Ringan": lb.korban?.korban_luka_ringan ?? 0,
          "Luka Berat": lb.korban?.korban_luka_berat ?? 0,
          "Meninggal": lb.korban?.korban_meninggal ?? 0,
          "Hilang": lb.korban?.korban_hilang ?? 0,
          "KK Mengungsi": lb.korban?.kk_mengungsi ?? 0,
          "Jiwa Mengungsi": lb.korban?.jiwa_mengungsi ?? 0,

          // Step 4 — Kerusakan
          "Rumah Rusak Ringan": lb.kerusakan?.rumah_rusak_ringan ?? 0,
          "Rumah Rusak Sedang": lb.kerusakan?.rumah_rusak_sedang ?? 0,
          "Rumah Rusak Berat": lb.kerusakan?.rumah_rusak_berat ?? 0,
          "Fasilitas Umum": (lb.fasilitas_terdampak ?? []).join(", ") || "-",
          "Kebutuhan Logistik": (lb.kebutuhan_logistik ?? []).join(", ") || "-",
          "Catatan Kerusakan": lb.kerusakan?.catatan_lain ?? "-",
          "Catatan Fasilitas": lb.kerusakan?.catatan_fasilitas_umum ?? "-",
          "Catatan Update": lb.catatan_update ?? "-",
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      // Auto column widths
      const colWidths = Object.keys(rows[0] ?? {}).map(k => ({ wch: Math.max(k.length + 2, 14) }));
      ws["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Bencana");
      XLSX.writeFile(wb, `rekap_lengkap_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      alert("Gagal export Excel. Coba lagi.");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteClick = (item: any) => {
    setDeleteModal(item);
  };

  const executeDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await api.delete(`/laporan/${deleteModal.id}`);
      queryClient.invalidateQueries({ queryKey: ["rekap-kabupaten-detail"] });
      alert("Laporan berhasil dihapus");
      setDeleteModal(null);
    } catch (err: any) {
      alert("Gagal menghapus laporan: " + (err.response?.data?.error || err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleScreenshot = async () => {
    if (!captureRef.current) return;
    setIsCapturing(true);
    try {
      await document.fonts.ready;
      captureRef.current.classList.add("capture-mode");
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await htmlToImage.toPng(captureRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `rekap_bencana_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Screenshot error:", e);
      alert("Gagal mengambil screenshot. " + String(e));
    }
    finally {
      if (captureRef.current) captureRef.current.classList.remove("capture-mode");
      setIsCapturing(false);
    }
  };


  /* ── Export PDF per ID ── */
  const handleExportPdfItem = async (itemId: number) => {
    try {
      const { data: lb } = await api.get(`/laporan/${itemId}`);
      let options = null;
      if (lb.jenis_bencana) {
        try {
          const { data } = await api.get(`/options/${lb.jenis_bencana}`);
          options = data;
        } catch { }
      }
      generatePdfReport(lb, options);
    } catch { alert("Gagal export PDF."); }
  };

  /* ── Update Status Handler ── */
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
      await queryClient.invalidateQueries({ queryKey: ["rekap-kabupaten-detail"] });
      setStatusModal(null);
    } catch {
      alert("Gagal memperbarui status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="bg-[#f9f9f9] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }} ref={captureRef}>
      <style>{`
        .capture-mode * {
          box-shadow: none !important;
          text-shadow: none !important;
        }
        .capture-mode {
          width: 1400px !important;
          min-width: 1400px !important;
          max-width: 1400px !important;
          background-color: #f9f9f9 !important;
          box-sizing: border-box !important;
          padding: 32px !important;
        }
        .capture-mode main {
          padding-top: 2rem !important;
          max-width: 100% !important;
          width: 100% !important;
          padding-left: 2rem !important;
          padding-right: 2rem !important;
        }
        .capture-mode .no-capture {
          display: none !important;
        }
        .capture-show {
          display: none !important;
        }
        .capture-mode .capture-show {
          display: block !important;
        }
      `}</style>
      <div className="no-capture"><SipenaNav /></div>
      <div className="no-capture"><NewsTicker /></div>
      <main className="pt-32 pb-12 px-4 sm:px-6 max-w-[1600px] mx-auto">

        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Rekapitulasi Bencana Regional</h1>
            <p className="text-sm text-slate-500 mt-1">Seluruh kejadian bencana di Kabupaten Rokan Hulu.</p>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm bg-white px-4 py-2.5 rounded-xl border border-slate-200 self-start md:self-auto shadow-sm">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            <span>Data hingga: {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
          </div>
        </header>

        {/* Active Filters Summary (Visible only during Capture Mode) */}
        <div className="capture-show mb-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Filter Aktif Laporan</h3>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-700">
            <div>
              <span className="text-slate-400 font-semibold mr-1.5">Kecamatan:</span>
              <span className="font-bold">
                {filterKecamatan === "semua" ? "Semua Kecamatan" : kecamatans.find(k => String(k.id) === filterKecamatan)?.nama_kecamatan}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold mr-1.5">Jenis Bencana:</span>
              <span className="font-bold capitalize">
                {filterJenis === "semua" ? "Semua Jenis" : filterJenis.replace(/_/g, " ")}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold mr-1.5">Status:</span>
              <span className="font-bold">
                {filterSiaga === "semua" ? "Semua Status" : SIAGA_LABEL[filterSiaga]}
              </span>
            </div>
            {(tanggalDari || tanggalSampai) && (
              <div>
                <span className="text-slate-400 font-semibold mr-1.5">Periode:</span>
                <span className="font-bold">
                  {tanggalDari ? new Date(tanggalDari).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "Awal"} s/d {tanggalSampai ? new Date(tanggalSampai).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "Hari Ini"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Filter */}
          <div className="p-4 sm:p-6 bg-slate-50/50 border-b border-slate-200 no-capture">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kecamatan</label>
                <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  value={filterKecamatan} onChange={(e) => setFilterKecamatan(e.target.value)}>
                  <option value="semua">Semua Kecamatan</option>
                  {kecamatans.map((k) => <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Jenis Bencana</label>
                <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}>
                  <option value="semua">Semua Jenis</option>
                  {ALL_JENIS.map((j) => <option key={j} value={j}>{j.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Siaga</label>
                <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  value={filterSiaga} onChange={(e) => setFilterSiaga(e.target.value)}>
                  <option value="semua">Semua Level</option>
                  <option value="siaga1">Siaga 1</option>
                  <option value="siaga2">Siaga 2</option>
                  <option value="siaga3">Siaga 3</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Periode</label>
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

            {/* Actions & Reset Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200/60 mt-6">
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setFilterKecamatan("semua");
                    setFilterJenis("semua");
                    setFilterSiaga("semua");
                    setTanggalDari("");
                    setTanggalSampai("");
                  }}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold border border-slate-200 transition-colors shadow-sm"
                >
                  Reset Filter
                </button>
                <div className="text-xs text-slate-400 font-medium leading-relaxed hidden md:block">
                  * Gunakan filter di atas untuk menyaring laporan bencana.
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                <button onClick={handleScreenshot} disabled={isCapturing}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 text-white px-5 h-11 rounded-xl font-bold hover:bg-amber-600 text-sm shadow-md disabled:opacity-60 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{isCapturing ? "hourglass_top" : "photo_camera"}</span>
                  Screenshot
                </button>
                <button onClick={handleExportExcel} disabled={isExporting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1C1F2B] text-white px-5 h-11 rounded-xl font-bold hover:bg-slate-700 text-sm shadow-md disabled:opacity-60 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{isExporting ? "hourglass_top" : "table_view"}</span>
                  {isExporting ? "Mengekspor..." : "Export Excel"}
                </button>
              </div>
            </div>
          </div>

          {/* Legend Aksi */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 flex flex-wrap items-center gap-4 no-capture">
            <span className="font-bold text-slate-600">Keterangan Aksi:</span>
            {role !== "pimpinan" && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">edit</span>
                  Update Status
                </span>
              </>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-amber-600">visibility</span>
              Detail
            </span>
            {role !== "pimpinan" && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-violet-600">edit_note</span>
                  Edit Detail
                </span>

              </>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-rose-600">picture_as_pdf</span>
              Export PDF
            </span>

            {role !== "pimpinan" && (
              <>

                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-red-600">delete</span>
                  Hapus
                </span>
              </>
            )}
          </div>

          {/* Tabel */}
          <div className="-mx-4 sm:mx-0 overflow-x-auto">
            <table className="min-w-[1200px] w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  {["No", "Tanggal", "Jenis Bencana", "Kecamatan", "Lokasi", "Pelapor", "Status", "LR", "LB", "M", "Aksi"].map((h) => (
                    <th key={h} className={`px-4 py-4 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${h === "Aksi" ? "no-capture" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={11} className="p-10 text-center text-slate-400">
                    <div className="animate-spin w-7 h-7 rounded-full border-4 border-amber-400 border-t-transparent mx-auto mb-2" />
                    Memuat data...
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={11} className="p-10 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">search_off</span>
                    Tidak ada data
                  </td></tr>
                ) : paginatedData.map((item: any, i: number) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-4 py-3 text-slate-400 text-sm">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                      {item.waktu_kejadian ? new Date(item.waktu_kejadian).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${JENIS_DOT[item.jenis_bencana] ?? "bg-slate-400"}`} />
                        <span className="text-sm capitalize">{item.jenis_bencana?.replace(/_/g, " ")}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.nama_kecamatan ?? "-"}</td>
                    <td className="px-4 py-3 max-w-[160px] truncate text-sm text-slate-500">{item.lokasi_text ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.nama_pelapor ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center whitespace-nowrap min-w-[72px] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase leading-none ${SIAGA_CLS[item.status] ?? "bg-slate-200 text-slate-600"}`}>
                          {SIAGA_LABEL[item.status] ?? item.status}
                        </span>
                        {role !== "pimpinan" && (
                          <button onClick={() => { setStatusModal(item); setNewStatus(item.status ?? "siaga3"); setUpdateNotes(item.catatan_update ?? ""); }}
                            className="p-1.5 rounded-lg text-blue-600 bg-blue-50 border border-blue-200 transition-all duration-200 hover:bg-blue-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(37,99,235,0.45)] flex items-center justify-center no-capture animate-glow" title="Update Status">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-xs font-bold font-mono bg-yellow-50 text-yellow-600 border border-yellow-200">
                        {item.korban_luka_ringan ?? 0}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-xs font-bold font-mono bg-orange-50 text-orange-600 border border-orange-200">
                        {item.korban_luka_berat ?? 0}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-xs font-bold font-mono bg-red-50 text-red-600 border border-red-200">
                        {item.korban_meninggal ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 no-capture">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => navigate(`/detail/${item.id}`)} title="Detail"
                          className="p-1.5 rounded-lg text-amber-600 bg-amber-50 border border-amber-200 transition-all duration-200 hover:bg-amber-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(217,119,6,0.45)] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        {role !== "pimpinan" && (
                          <button onClick={() => navigate(`/edit-detail/${item.id}`)} title="Edit Detail Kejadian"
                            className="p-1.5 rounded-lg text-violet-600 bg-violet-50 border border-violet-200 transition-all duration-200 hover:bg-violet-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(124,58,237,0.45)] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">edit_note</span>
                          </button>
                        )}
                        <button onClick={() => handleExportPdfItem(item.id)} title="Export PDF"
                          className="p-1.5 rounded-lg text-rose-600 bg-rose-50 border border-rose-200 transition-all duration-200 hover:bg-rose-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(225,29,72,0.45)] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                        </button>
                        {role !== "pimpinan" && (
                          <button onClick={() => handleDeleteClick(item)} title="Hapus Laporan"
                            className="p-1.5 rounded-lg text-red-600 bg-red-50 border border-red-200 transition-all duration-200 hover:bg-red-100 hover:scale-105 active:scale-95 hover:shadow-[0_0_12px_rgba(220,38,38,0.45)] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Menampilkan <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> hingga <strong>{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> dari <strong>{filtered.length}</strong> entri
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="text-sm font-medium text-slate-600">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
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

      {/* Modal Konfirmasi Delete */}
      {deleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
              <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                Konfirmasi Hapus Laporan
              </h2>
              <button onClick={() => setDeleteModal(null)} className="text-red-400 hover:text-red-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Anda akan menghapus laporan ini secara permanen. Data tidak dapat dikembalikan setelah dihapus.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Laporan #{deleteModal.id}</p>
                <p className="text-sm font-semibold text-slate-700">{deleteModal.jenis_bencana?.replace(/_/g, " ").toUpperCase()}</p>
                <p className="text-xs text-slate-500">{deleteModal.nama_kecamatan}</p>
                <p className="text-xs text-slate-500 mt-1">Tgl: {new Date(deleteModal.waktu_kejadian).toLocaleString('id-ID')}</p>
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
