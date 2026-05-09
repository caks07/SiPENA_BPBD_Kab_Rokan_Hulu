import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";
import { useAuth } from "../state/AuthContext";
import { generatePdfReport } from "../utils/pdfExport";


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const SIAGA_BADGE: Record<string, { cls: string; label: string }> = {
  siaga1: { cls: "bg-red-100 text-red-700 border-red-300",       label: "Siaga 1 — Bahaya" },
  siaga2: { cls: "bg-orange-100 text-orange-700 border-orange-300", label: "Siaga 2 — Siaga" },
  siaga3: { cls: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "Siaga 3 — Waspada" },
  selesai:{ cls: "bg-green-100 text-green-700 border-green-300",   label: "Selesai" },
};

const JENIS_ICON: Record<string, string> = {
  banjir:"water_drop", banjir_bandang:"waves", tanah_longsor:"landscape",
  cuaca_ekstrim:"air", kekeringan:"wb_sunny", karhutla:"local_fire_department",
  wabah:"coronavirus", gempa_bumi:"activity_zone", konflik_sosial:"groups",
};

const formatWIB = (dateString: string) => {
  if (!dateString) return "-";
  // pastikan parsing sebagai UTC sebelum convert ke Jakarta
  const safeStr = dateString.includes("T") ? (dateString.endsWith("Z") ? dateString : dateString + "Z") : dateString.replace(" ", "T") + "Z";
  return new Date(safeStr).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
};

const formatLocal = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
};

const FIELD_LABELS: Record<string, string> = {
  korban_meninggal: "Korban Meninggal Dunia",
  korban_luka_ringan: "Korban Luka Ringan",
  korban_luka_berat: "Korban Luka Berat",
  korban_hilang: "Korban Hilang",
  kk_mengungsi: "KK Mengungsi",
  jiwa_mengungsi: "Jiwa Mengungsi",
  rumah_rusak_berat: "Rumah Rusak Berat",
  rumah_rusak_sedang: "Rumah Rusak Sedang",
  rumah_rusak_ringan: "Rumah Rusak Ringan",
  kronologi: "Kronologi Kejadian",
  penyebab_ids: "Penyebab Kejadian",
  kondisi_cuaca_id: "Kondisi Cuaca",
  fasilitas_terdampak: "Fasilitas Terdampak",
  kebutuhan_logistik: "Kebutuhan Logistik",
  waktu_kejadian: "Waktu Kejadian",
  lokasi_text: "Titik Lokasi",
  nama_pelapor: "Nama Pelapor",
  kecamatan_id: "Kecamatan",
};

function formatValue(key: string, value: any, options: any, jenisBencana?: string, kecamatanList?: any[]): any {
  if (value === null || value === undefined || value === "") return null;

  // Resolve kecamatan_id ke nama kecamatan
  if (key === "kecamatan_id" && kecamatanList) {
    const kec = kecamatanList.find((k: any) => String(k.id) === String(value));
    if (kec) return kec.nama_kecamatan;
    return `Kecamatan #${value}`;
  }

  if (key.includes("korban") || key.includes("jiwa")) {
    return `${value} jiwa`;
  }
  if (key.includes("kk")) {
    return `${value} KK`;
  }
  if (key.includes("rumah_rusak")) {
    return `${value} unit`;
  }

  // Coba resolve label dari options detail_bencana jika ada
  if (jenisBencana && FIELD_OPT_KEYS[jenisBencana]?.[key]) {
    const optKey = FIELD_OPT_KEYS[jenisBencana][key];
    const resolved = resolveLabel(value, optKey, options);
    if (resolved !== "-") return resolved;
  }

  if (Array.isArray(value)) {
    return value.map(v => String(v)).join(", ");
  }

  return String(value);
}

// Field configs per jenis bencana: maps field name → optKey (if ID-based)
const FIELD_OPT_KEYS: Record<string, Record<string, string | null>> = {
  banjir: {
    penyebab_ids:"opt_banjir_penyebab", ketinggian_banjir_id:"opt_banjir_ketinggian",
    kondisi_air_id:"opt_banjir_kondisi_air", kondisi_cuaca_id:"opt_kondisi_cuaca",
    luas_genangan: null, penyebab_lain: null, ketinggian_banjir_lain: null,
  },
  banjir_bandang: {
    kondisi_cuaca_id:"opt_kondisi_cuaca", kecepatan_air_id:"opt_bandang_kecepatan_air",
    kondisi_arus_id:"opt_bandang_kondisi_arus",
    material_terbawa_ids:"opt_bandang_material_terbawa",
    kerusakan_infrastruktur_ids:"opt_bandang_kerusakan_infrastruktur",
  },
  tanah_longsor: {
    kondisi_cuaca_id:"opt_kondisi_cuaca", penyebab_id:"opt_longsor_penyebab",
    jenis_lokasi_id:"opt_longsor_jenis_lokasi", akses_transportasi_id:"opt_longsor_akses_transportasi",
    material_ids:"opt_longsor_material", potensi_susulan_id:"opt_longsor_potensi_susulan",
    dimensi_longsor: null,
  },
  cuaca_ekstrim: {
    kondisi_cuaca_id:"opt_kondisi_cuaca", fenomena_id:"opt_cuaca_fenomena", dampak_pohon_id:"opt_cuaca_dampak_pohon",
    kerusakan_bangunan_id:"opt_cuaca_kerusakan_bangunan",
  },
  kekeringan: {
    sektor_terdampak_ids:"opt_kekeringan_sektor", kondisi_air_id:"opt_kekeringan_kondisi_air",
    durasi_id:"opt_kekeringan_durasi", potensi_risiko_ids:"opt_kekeringan_potensi_risiko",
    upaya_masyarakat_ids:"opt_kekeringan_upaya_masyarakat",
    luas_lahan: null, jumlah_kk: null,
  },
  karhutla: {
    kondisi_api_id:"opt_karhutla_kondisi_api", jenis_lahan_id:"opt_karhutla_jenis_lahan",
    pemilik_lahan_id:"opt_karhutla_pemilik_lahan", jarak_ke_pemukiman_id:"opt_karhutla_jarak_pemukiman",
    sumber_air_id:"opt_karhutla_sumber_air", akses_lokasi_id:"opt_karhutla_akses_lokasi",
    luas_terbakar: null,
  },
  wabah: {
    jenis_penyakit_id:"opt_wabah_jenis_penyakit", sebaran_id:"opt_wabah_sebaran",
    fasilitas_kesehatan_id:"opt_wabah_fasilitas_kesehatan", kondisi_sanitasi_id:"opt_wabah_kondisi_sanitasi",
    jumlah_bergejala: null, kronologi: null,
  },
  gempa_bumi: {
    durasi_id:"opt_gempa_durasi", kekuatan_id:"opt_gempa_kekuatan",
    dampak_struktural_ids:"opt_gempa_dampak_struktural", kerusakan_jalan_ids:"opt_gempa_kerusakan_jalan",
    potensi_susulan_id:"opt_gempa_potensi_susulan", kondisi_warga_id:"opt_gempa_kondisi_warga",
  },
  konflik_sosial: {
    sifat_konflik_id:"opt_konflik_sifat", aktor_id:"opt_konflik_aktor",
    pemicu_id:"opt_konflik_pemicu", jumlah_terlibat_id:"opt_konflik_jumlah_terlibat",
    kerusakan_materil_id:"opt_konflik_kerusakan_materil", aparat_ids:"opt_konflik_aparat",
  },
};

function resolveLabel(val: any, optKey: string | null, options: any): string {
  if (val === null || val === undefined || val === "") return "-";
  
  let parsedVal = val;
  if (typeof val === "string" && val.startsWith("{") && val.endsWith("}")) {
    const inner = val.slice(1, -1).trim();
    parsedVal = inner ? inner.split(",").map(s => Number(s.trim())) : [];
  }

  if (!optKey || !options) {
    if (Array.isArray(parsedVal)) return parsedVal.join(", ");
    return String(parsedVal);
  }

  const list: any[] = options[optKey] ?? [];
  if (Array.isArray(parsedVal)) {
    const ids = parsedVal as number[];
    return ids.map((id) => list.find((o) => o.id === id)?.label ?? String(id)).join(", ") || "-";
  }
  return list.find((o) => o.id == parsedVal)?.label ?? String(parsedVal);
}

/** Satuan untuk field numerik bebas (bukan dari opsi referensi) */
const FIELD_UNITS: Record<string, string> = {
  luas_genangan:   "m²",
  luas_terbakar:   "Ha",
  luas_lahan:      "Ha",
  jumlah_bergejala:"jiwa",
  jumlah_kk:       "KK",
  dimensi_longsor: "m",
};

/** Label tampilan yang lebih deskriptif untuk field numerik */
const FIELD_DISPLAY_LABELS: Record<string, string> = {
  luas_genangan:    "Estimasi Luas Genangan",
  luas_terbakar:    "Estimasi Luas Terbakar",
  luas_lahan:       "Luas Lahan Terdampak",
  jumlah_bergejala: "Jumlah Warga Bergejala",
  jumlah_kk:        "Jumlah KK Terdampak",
  dimensi_longsor:  "Dimensi Longsor (P × L × T)",
  kronologi:        "Kronologi Kejadian",
};

function DetailBencanaCard({ jenis, detail, options }: { jenis: string; detail: any; options: any }) {
  const fieldMap = FIELD_OPT_KEYS[jenis] ?? {};
  const skip = new Set(["laporan_id", "created_at", "updated_at"]);
  const entries = Object.entries(detail).filter(([k]) => !skip.has(k));
  if (entries.length === 0) return null;
  const jenisIcon = JENIS_ICON[jenis] ?? "warning";
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-amber-50 p-4 border-b border-amber-200 flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>{jenisIcon}</span>
        <h3 className="text-base font-bold text-amber-700">Detail: {jenis.replace(/_/g," ").toUpperCase()}</h3>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([key, val]) => {
          if (key.endsWith("_lain")) return null; // hide raw _lain fields

          const optKey = fieldMap[key] ?? null;
          let label = resolveLabel(val, optKey, options);

          // FIX: hanya ambil _lain jika lainKey berbeda dari key (regex match berhasil)
          const lainKey = key.replace(/_ids?$/, "_lain");
          const lainVal = lainKey !== key ? detail[lainKey] : undefined;
          if (lainVal && lainVal !== "" && label.toLowerCase().includes("lain")) {
            label = `${label} — ${lainVal}`;
          } else if (lainVal && lainVal !== "" && !optKey) {
            label = `${label} — ${lainVal}`;
          } else if (lainVal && lainVal !== "") {
            label = `${label} (Lainnya: ${lainVal})`;
          }

          // Tambahkan satuan untuk field numerik bebas
          const unit = FIELD_UNITS[key];
          if (unit && label && label !== "-" && !isNaN(Number(label))) {
            label = `${label} ${unit}`;
          }

          // Gunakan label deskriptif jika tersedia, fallback ke key-based
          const displayKey = FIELD_DISPLAY_LABELS[key]
            ?? key.replace(/_ids?$/, "").replace(/_/g, " ");

          if (!label || label === "-" || label === "null") return null;
          return (
            <div key={key} className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{displayKey}</p>
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">{label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const handleKembali = () => {
    if (role === "operator") navigate("/rekap/kecamatan");
    else if (role === "admin" || role === "admin_kab") navigate("/rekap/kabupaten");
    else navigate("/dashboard");
  };

  const { data: laporan, isLoading } = useQuery({
    queryKey: ["laporan", id],
    queryFn: async () => { const { data } = await api.get(`/laporan/${id}`); return data; },
  });

  const jenisBencana = laporan?.jenis_bencana;
  const { data: options } = useQuery({
    queryKey: ["options", jenisBencana],
    queryFn: async () => { const { data } = await api.get(`/options/${jenisBencana}`); return data; },
    enabled: !!jenisBencana,
  });

  const { data: kecamatanList = [] } = useQuery({
    queryKey: ["kecamatan-list"],
    queryFn: async () => { const { data } = await api.get("/kecamatan"); return data as { id: number; nama_kecamatan: string }[]; },
    staleTime: 10 * 60 * 1000,
  });

  // Satellite layer state for mini map
  const [mapLayer, setMapLayer] = useState<"osm"|"satellite">("satellite");
  // GeoJSON boundary
  const [geojson, setGeojson] = useState<any>(null);
  useEffect(() => {
    fetch("/MapRohul.geojson").then(r => r.json()).then(setGeojson).catch(() => {});
  }, []);

  // Modal State for Image Gallery
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! > 0 ? prev! - 1 : laporan.fotos.length - 1));
  };
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev! < laporan.fotos.length - 1 ? prev! + 1 : 0));
  };

  const getImageUrl = (foto: any) => {
    // Gunakan /storage proxy (di-proxy oleh Vite ke backend) agar bekerja via ngrok
    if (foto.file_path) {
      // file_path biasanya "/storage/fotos/xxx.jpg"
      return foto.file_path.startsWith("/") ? foto.file_path : `/${foto.file_path}`;
    }
    return foto.url ?? "";
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) => (prev! > 0 ? prev! - 1 : laporan.fotos.length - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev! < laporan.fotos.length - 1 ? prev! + 1 : 0));
      } else if (e.key === "Escape") {
        setSelectedIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, laporan]);

  // Modal State for Update Status
  const [statusModal, setStatusModal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("siaga3");
  const [updateNotes, setUpdateNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal) return;
    setIsUpdatingStatus(true);
    try {
      await api.put(`/laporan/${statusModal.id}`, { status: newStatus, catatan_update: updateNotes });
      queryClient.invalidateQueries({ queryKey: ["laporan", id] });
      setStatusModal(null);
    } catch (err) {
      alert("Gagal update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent" />
    </div>
  );
  if (!laporan) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <p className="text-slate-500">Laporan tidak ditemukan.</p>
    </div>
  );

  const lat = parseFloat(laporan.latitude);
  const lng = parseFloat(laporan.longitude);
  const hasCoord = !isNaN(lat) && !isNaN(lng) && lat !== 0;
  const status = laporan.status ?? "siaga3";
  const badge = SIAGA_BADGE[status] ?? SIAGA_BADGE.siaga3;
  const jenisLabel = laporan.jenis_bencana?.replace(/_/g, " ")?.toUpperCase() ?? "-";
  const korban = laporan.korban ?? null;
  const kerusakan = laporan.kerusakan ?? null;
  const detail = laporan.detail ?? null;
  const logs = laporan.logs ?? [];
  const sortedLogs = [...logs].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const initials = laporan.nama_pelapor
    ? laporan.nama_pelapor.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?";


  // Role-based visibility
  // operator: cannot update status, cannot print
  // pimpinan: read only (cannot update status)
  const canUpdateStatus = role !== "pimpinan" && role !== "operator";
  const canPrint = role !== "operator";

  const handlePrint = () => {
    generatePdfReport(laporan, options);
  };

  return (
    <div className="bg-[#F8F9FA] text-[#201A17] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <SipenaNav />
      <NewsTicker />
      <main className="mt-[104px] px-4 pb-12">
        <div className="max-w-6xl mx-auto space-y-6 py-6">

          {/* Header */}
          <section className="space-y-4">
            {/* Title area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[#F39200] text-sm">location_on</span>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    {laporan.nama_kecamatan ?? "Kecamatan"}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight leading-tight">
                  {jenisLabel} — {laporan.lokasi_text ?? "Rokan Hulu"}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1.5 text-sm text-slate-500 font-mono">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    {laporan.waktu_kejadian ? new Date(laporan.waktu_kejadian).toLocaleString("id-ID") : "-"}
                  </span>
                  <span className={`px-3 py-0.5 rounded-full border text-[11px] font-bold uppercase ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">ID: #{laporan.id}</span>
                </div>
              </div>
            </div>

            {/* Action buttons — responsive grid on mobile, flex row on desktop */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 no-print">
              <button onClick={handleKembali}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm text-slate-700 active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                <span>Kembali</span>
              </button>
              {canPrint && (
                <button onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm text-slate-700 active:scale-95 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">print</span>
                  <span>Cetak PDF</span>
                </button>
              )}
              {canUpdateStatus && (
                <>
                  <button onClick={() => navigate(`/edit-detail/${id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm text-slate-700 active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                    <span>Edit Laporan</span>
                  </button>
                  <button onClick={() => { setStatusModal(laporan); setNewStatus(laporan.status ?? "siaga3"); setUpdateNotes(laporan.catatan_update ?? ""); }}
                    className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F39200] text-white font-semibold rounded-xl text-sm hover:brightness-110 shadow-md active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">update</span>
                    <span>Update Status</span>
                  </button>
                </>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ── Kolom Kiri 8/12 ── */}
            <div className="lg:col-span-8 space-y-5">

              {/* Info Dasar (Form Halaman 1) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h3 className="text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">Informasi Pelaporan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pelapor</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">{initials}</div>
                      <div>
                        <p className="font-semibold text-slate-800">{laporan.nama_pelapor ?? "-"}</p>
                        <p className="text-xs text-slate-500">{laporan.sumber_laporan ?? "TRC"}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Koordinat GPS</p>
                    {hasCoord ? (
                      <p className="font-mono text-[#F39200] bg-amber-50 px-3 py-2 rounded border border-amber-100 text-sm">
                        {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
                      </p>
                    ) : <p className="text-slate-400 text-sm">Tidak tersedia</p>}
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Deskripsi Lokasi</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{laporan.lokasi_text ?? "-"}</p>
                  </div>
                  {laporan.catatan_update && (
                    <div className="md:col-span-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Catatan Update</p>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">{laporan.catatan_update}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Bencana Spesifik (Form Halaman 2) */}
              {detail && <DetailBencanaCard jenis={laporan.jenis_bencana} detail={detail} options={options} />}

              {/* Dampak Manusia & Kerusakan (Form Halaman 3) */}
              <div className="grid grid-cols-1 gap-5">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-red-500">groups</span>
                    <h3 className="text-base font-bold text-slate-800">Dampak Manusia</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Meninggal",  value: korban?.korban_meninggal ?? 0,  cls: "text-red-600",  bg: "bg-red-50 border-red-100" },
                      { label: "Luka",       value: (korban?.korban_luka_ringan ?? 0) + (korban?.korban_luka_berat ?? 0), cls: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                      { label: "Mengungsi",  value: korban?.jiwa_mengungsi ?? 0,    cls: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                    ].map(({ label, value, cls, bg }) => (
                      <div key={label} className={`${bg} border p-3 rounded-xl text-center`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</p>
                        <p className={`text-2xl font-bold ${cls}`}>{value}</p>
                        <p className={`text-[9px] font-bold ${cls}`}>JIWA</p>
                      </div>
                    ))}
                    {korban && (
                      <>
                        <div className="col-span-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <div><p className="text-[10px] text-slate-400 font-bold uppercase">Luka Ringan</p><p className="font-semibold text-slate-700">{korban.korban_luka_ringan ?? 0}</p></div>
                          <div><p className="text-[10px] text-slate-400 font-bold uppercase">Luka Berat</p><p className="font-semibold text-slate-700">{korban.korban_luka_berat ?? 0}</p></div>
                          <div><p className="text-[10px] text-slate-400 font-bold uppercase">KK Mengungsi</p><p className="font-semibold text-slate-700">{korban.kk_mengungsi ?? 0}</p></div>
                          <div><p className="text-[10px] text-slate-400 font-bold uppercase">Hilang</p><p className="font-semibold text-slate-700">{korban.korban_hilang ?? 0}</p></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-amber-500">domain</span>
                    <h3 className="text-base font-bold text-slate-800">Kerusakan Fisik</h3>
                  </div>
                  {kerusakan ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Rumah</p>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { label: "Rusak Berat",  val: kerusakan.rumah_rusak_berat ?? 0,  cls: "bg-red-50 text-red-600 border-red-100" },
                            { label: "Rusak Sedang", val: kerusakan.rumah_rusak_sedang ?? 0, cls: "bg-orange-50 text-orange-600 border-orange-100" },
                            { label: "Rusak Ringan", val: kerusakan.rumah_rusak_ringan ?? 0, cls: "bg-yellow-50 text-yellow-700 border-yellow-100" },
                          ].map(({ label, val, cls }) => (
                            <span key={label} className={`${cls} border px-2.5 py-1 rounded text-xs font-bold`}>{label}: {val}</span>
                          ))}
                        </div>
                      </div>
                      {kerusakan.catatan_lain && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Catatan</p>
                          <p className="text-sm text-slate-600">{kerusakan.catatan_lain}</p>
                        </div>
                      )}
                    </div>
                  ) : <p className="text-slate-400 text-sm text-center py-4">Tidak ada data kerusakan</p>}
                </div>
              </div>

              {/* Foto (Form Halaman 4) */}
              {laporan.fotos && laporan.fotos.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Dokumentasi Lapangan</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {laporan.fotos.map((foto: any, i: number) => (
                      <img key={foto.id ?? i}
                        src={getImageUrl(foto)}
                        onClick={() => setSelectedIndex(i)}
                        className="w-full h-28 object-cover rounded-lg border border-slate-100 cursor-pointer hover:opacity-90"
                        alt={`Dokumentasi ${i + 1}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Kolom Kanan 4/12 ── */}
            <div className="lg:col-span-4 space-y-5">
              {/* Mini Map — Satellite Default + GeoJSON Boundary */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {hasCoord ? (
                  <>
                    <div className="relative h-56">
                      {/* Pulse indicator */}
                      <div className="absolute top-3 left-3 z-[400] bg-white/90 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#F39200] animate-pulse" />
                        <span className="text-xs font-bold text-slate-700">LOKASI KEJADIAN</span>
                      </div>
                      {/* Layer switcher */}
                      <div className="absolute top-3 right-3 z-[400] flex overflow-hidden rounded-md border border-slate-200 shadow-sm">
                        {(["satellite", "osm"] as const).map(l => (
                          <button key={l} type="button" onClick={() => setMapLayer(l)}
                            className={`px-2 py-1 text-[10px] font-bold uppercase transition-colors ${
                              mapLayer === l ? "bg-[#F39200] text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                            }`}>
                            {l === "osm" ? "Peta" : "Sat"}
                          </button>
                        ))}
                      </div>
                      <MapContainer center={[lat, lng]} zoom={13} minZoom={5} maxZoom={mapLayer === "satellite" ? 17 : 19} maxBounds={[[6.0, 95.0], [-6.0, 109.0]]} className="w-full h-full" zoomControl={false}>
                        <TileLayer
                          key={mapLayer}
                          url={mapLayer === "satellite"
                            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                          attribution={mapLayer === "satellite" ? "Tiles © Esri" : "© OpenStreetMap"}
                          maxZoom={mapLayer === "satellite" ? 17 : 19}
                        />
                        {mapLayer === "satellite" && (
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution="" pane="shadowPane" />
                        )}
                        {/* Batas wilayah kecamatan */}
                        {geojson && (
                          <GeoJSON key={mapLayer} data={geojson as any} style={{
                            color: mapLayer === "satellite" ? "#FCD34D" : "#1E40AF",
                            weight: 2, opacity: 0.9,
                            fillColor: "transparent", fillOpacity: 0,
                          }} />
                        )}
                        <Marker position={[lat, lng]} />
                      </MapContainer>
                    </div>
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between">
                      <span className="text-xs font-mono text-slate-500">LAT: {lat.toFixed(5)}</span>
                      <span className="text-xs font-mono text-slate-500">LNG: {lng.toFixed(5)}</span>
                    </div>
                  </>
                ) : (
                  <div className="h-40 flex items-center justify-center bg-slate-50">
                    <p className="text-sm text-slate-400">Koordinat tidak tersedia</p>
                  </div>
                )}
              </div>

              {/* Google Maps Card — tampil hanya jika koordinat valid */}
              {hasCoord && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border-b border-green-100">
                    <span className="material-symbols-outlined text-green-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                    <p className="text-sm font-bold text-green-700 uppercase tracking-wider">Buka Lokasi di Google Maps</p>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors active:scale-95 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      Lihat di Google Maps
                    </a>
                  </div>
                </div>
              )}

              {/* Fasilitas Umum Terdampak */}
              {laporan.fasilitas_terdampak?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 print-card">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Fasilitas Umum Terdampak</h4>
                  <div className="flex flex-wrap gap-2">
                    {laporan.fasilitas_terdampak.map((f: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                        <span className="material-symbols-outlined text-[14px]">account_balance</span>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Kebutuhan Logistik */}
              {laporan.kebutuhan_logistik?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 print-card">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Kebutuhan Logistik Mendesak</h4>
                  <div className="flex flex-wrap gap-2">
                    {laporan.kebutuhan_logistik.map((l: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                        <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}


              {/* Log Aktivitas */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Log Aktivitas</h4>
                <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  {/* Selalu tampilkan laporan dibuat di urutan pertama (paling tua) */}
                  <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center z-10">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      [{formatLocal(laporan.waktu_kejadian)}]
                    </p>
                    <p className="text-sm text-slate-700 font-semibold">Laporan Masuk via SiPENA</p>
                  </div>
                  
                  {/* Render array log (diurutkan ascending) */}
                  {sortedLogs.map((log: any, i: number) => {
                    let oldVal: any = null;
                    let newVal: any = null;
                    try {
                      oldVal = typeof log.old_value === 'string' ? JSON.parse(log.old_value) : log.old_value;
                      newVal = typeof log.new_value === 'string' ? JSON.parse(log.new_value) : log.new_value;
                    } catch(e) {}
                    
                    // Kumpulkan baris diff yang berubah
                    const diffRows: { label: string; oldFmt: string; newFmt: string }[] = [];
                    if (log.aksi !== "update_status" && oldVal && newVal && Object.keys(newVal).length > 0) {
                      Object.keys(newVal).forEach((key) => {
                        const oldFormatted = formatValue(key, oldVal[key], options, laporan.jenis_bencana, kecamatanList as any[]);
                        const newFormatted = formatValue(key, newVal[key], options, laporan.jenis_bencana, kecamatanList as any[]);
                        if (!newFormatted) return;
                        if (oldFormatted === newFormatted) return;
                        const label = FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                        diffRows.push({ label, oldFmt: String(oldFormatted || "-"), newFmt: String(newFormatted) });
                      });
                    }

                    return (
                      <div key={i} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center z-10">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          [{formatWIB(log.created_at)}]
                        </p>
                        <p className="text-sm font-semibold text-slate-800">{log.user ? log.user.name : "System"}</p>
                        
                        {diffRows.length > 0 ? (
                          <>
                            <p className="text-sm text-slate-700 font-medium mb-1">Mengubah data laporan</p>
                            <div className="mt-1 rounded-lg overflow-hidden border border-slate-200">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-500">
                                    <th className="text-left px-2 py-1.5 font-bold uppercase tracking-wider w-1/3">Field</th>
                                    <th className="text-left px-2 py-1.5 font-bold uppercase tracking-wider text-red-500">Sebelum</th>
                                    <th className="text-left px-2 py-1.5 font-bold uppercase tracking-wider text-emerald-600">Sesudah</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {diffRows.map((row, ri) => (
                                    <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                      <td className="px-2 py-1.5 font-semibold text-slate-600 border-t border-slate-100">{row.label}</td>
                                      <td className="px-2 py-1.5 text-red-500 border-t border-slate-100 break-words">{row.oldFmt}</td>
                                      <td className="px-2 py-1.5 text-emerald-600 font-semibold border-t border-slate-100 break-words">{row.newFmt}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-slate-700">{log.catatan}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FAB dihapus — tombol aksi sudah ada di header section atas yang responsif */}
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
      {/* Modal Image Gallery */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
             onClick={() => setSelectedIndex(null)}>
          
          <button onClick={() => setSelectedIndex(null)} className="absolute top-6 right-6 text-white hover:text-amber-400 transition-colors bg-black/40 rounded-full p-2">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          
          {laporan.fotos.length > 1 && (
            <button onClick={handlePrevImage} className="absolute left-4 lg:left-10 top-1/2 -translate-y-1/2 text-white hover:text-amber-400 transition-colors bg-black/40 rounded-full p-3 z-50">
              <span className="material-symbols-outlined text-4xl">chevron_left</span>
            </button>
          )}

          <div className="relative max-w-5xl w-full flex flex-col items-center gap-4">
             <img src={getImageUrl(laporan.fotos[selectedIndex])}
                  className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                  alt={`Preview ${selectedIndex + 1}`}
                  onClick={(e) => e.stopPropagation()} />
             
             <div className="bg-black/50 px-4 py-2 rounded-full text-white font-mono text-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                {selectedIndex + 1} / {laporan.fotos.length}
             </div>
          </div>

          {laporan.fotos.length > 1 && (
            <button onClick={handleNextImage} className="absolute right-4 lg:right-10 top-1/2 -translate-y-1/2 text-white hover:text-amber-400 transition-colors bg-black/40 rounded-full p-3 z-50">
              <span className="material-symbols-outlined text-4xl">chevron_right</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
