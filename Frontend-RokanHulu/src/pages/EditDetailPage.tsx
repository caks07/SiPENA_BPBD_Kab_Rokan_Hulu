/**
 * EditDetailPage — Edit detail lengkap laporan bencana (prefilled form Step 1–4)
 * Route: /edit-detail/:id
 * 
 * Menampilkan form yang sama dengan Step 1-4 tapi sudah prefill dari API.
 * Submit via PUT /laporan/:id
 */
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, GeoJSON } from "react-leaflet";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";

/** Custom TimeInput: wheel picker HH:mm slider */
const TimeInput = ({ value, dateVal, onChange }: { value: string; dateVal: string; onChange: (val: string) => void }) => {
  const [showPicker, setShowPicker] = useState(false);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const getInitialTime = () => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      return { hour: parseInt(h) || 0, minute: parseInt(m) || 0 };
    }
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  };

  const [time, setTime] = useState(getInitialTime);

  useEffect(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      const hourVal = parseInt(h) || 0;
      const minVal = parseInt(m) || 0;
      setTime({ hour: hourVal, minute: minVal });
      if (hourRef.current) {
        hourRef.current.scrollTop = hourVal * 36;
      }
      if (minuteRef.current) {
        minuteRef.current.scrollTop = minVal * 36;
      }
    }
  }, [value]);

  const selectHour = (h: number) => {
    setTime(prev => ({ ...prev, hour: h }));
    if (hourRef.current) {
      hourRef.current.scrollTo({ top: h * 36, behavior: "smooth" });
    }
  };

  const selectMinute = (m: number) => {
    setTime(prev => ({ ...prev, minute: m }));
    if (minuteRef.current) {
      minuteRef.current.scrollTo({ top: m * 36, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (showPicker) {
      setTimeout(() => {
        if (hourRef.current) hourRef.current.scrollTop = time.hour * 36;
        if (minuteRef.current) minuteRef.current.scrollTop = time.minute * 36;
      }, 50);
    }
  }, [showPicker]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, isHour: boolean) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / 36);
    if (isHour) {
      if (index >= 0 && index < 24 && index !== time.hour) {
        setTime(prev => ({ ...prev, hour: index }));
      }
    } else {
      if (index >= 0 && index < 60 && index !== time.minute) {
        setTime(prev => ({ ...prev, minute: index }));
      }
    }
  };

  const handleClose = () => {
    const today = getLocalDateString();
    let finalHour = time.hour;
    let finalMinute = time.minute;

    if (dateVal === today) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const selectedTime = `${String(finalHour).padStart(2, "0")}:${String(finalMinute).padStart(2, "0")}`;
      if (selectedTime > currentTime) {
        alert("Waktu kejadian tidak boleh melebihi waktu saat ini! Waktu disesuaikan ke jam sekarang.");
        finalHour = now.getHours();
        finalMinute = now.getMinutes();
        setTime({ hour: finalHour, minute: finalMinute });
      }
    }
    onChange(`${String(finalHour).padStart(2, "0")}:${String(finalMinute).padStart(2, "0")}`);
    setShowPicker(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const formatted = `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;

  return (
    <div className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-100 transition-all text-sm h-[42px] w-full sm:w-auto justify-center"
      >
        <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
        {formatted}
      </button>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-[1999] bg-black/20" onClick={handleClose} />
          <div className="absolute right-0 bottom-full mb-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[2000] w-64 text-white">
            <div className="text-center font-bold text-xs uppercase tracking-widest text-slate-400 mb-2">Pilih Waktu</div>
            
            {/* Wheel container */}
            <div className="relative h-[144px] bg-slate-950 rounded-xl overflow-hidden flex justify-center border border-slate-800">
              {/* Active highlight overlay */}
              <div className="absolute left-0 right-0 top-[54px] h-[36px] bg-slate-800/50 border-y border-slate-700 pointer-events-none z-10" />

              {/* Hours Column */}
              <div
                ref={hourRef}
                onScroll={(e) => handleScroll(e, true)}
                className="w-16 h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-[54px] z-20 text-center"
                style={{ scrollbarWidth: "none" }}
              >
                {hours.map((h) => (
                  <div
                    key={`h-${h}`}
                    onClick={() => selectHour(h)}
                    className={`h-[36px] snap-center flex items-center justify-center font-mono font-bold text-lg cursor-pointer transition-colors ${
                      time.hour === h ? "text-amber-400 font-extrabold text-xl scale-110" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {String(h).padStart(2, "0")}
                  </div>
                ))}
              </div>

              <div className="h-full flex items-center justify-center font-bold text-slate-400 px-2 z-10">:</div>

              {/* Minutes Column */}
              <div
                ref={minuteRef}
                onScroll={(e) => handleScroll(e, false)}
                className="w-16 h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-[54px] z-20 text-center"
                style={{ scrollbarWidth: "none" }}
              >
                {minutes.map((m) => (
                  <div
                    key={`m-${m}`}
                    onClick={() => selectMinute(m)}
                    className={`h-[36px] snap-center flex items-center justify-center font-mono font-bold text-lg cursor-pointer transition-colors ${
                      time.minute === m ? "text-amber-400 font-extrabold text-xl scale-110" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {String(m).padStart(2, "0")}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  selectHour(now.getHours());
                  selectMinute(now.getMinutes());
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-300 transition-colors"
              >
                Sekarang
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-xs font-bold rounded-lg text-slate-950 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/** FlyToPosition: auto-pan peta saat koordinat berubah */
function FlyToPosition({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const prev = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (position && (prev.current === null || prev.current[0] !== position[0] || prev.current[1] !== position[1])) {
      map.flyTo(position, Math.max(map.getZoom(), 12), { animate: true, duration: 0.8 });
      prev.current = position;
    }
  }, [position, map]);
  return null;
}

// FIELD_CONFIGS: same definition as Step2DetailBencana (subset shown, reused)
type FieldCfg = { name: string; label: string; type: "radio"|"checkbox"|"text"|"number"; optKey?: string; required?: boolean; showOtherField?: boolean; otherName?: string };
const FIELD_CONFIGS: Record<string, FieldCfg[]> = {
  banjir: [
    { name: "penyebab_ids", label: "Kronologi Kejadian (Penyebab)", type: "checkbox", optKey: "opt_banjir_penyebab", required: true, showOtherField: true, otherName: "penyebab_lain" },
    { name: "ketinggian_banjir_id", label: "Ketinggian Banjir", type: "radio", optKey: "opt_banjir_ketinggian", required: true, showOtherField: true, otherName: "ketinggian_banjir_lain" },
    { name: "kondisi_air_id", label: "Kondisi Air Saat Ini", type: "radio", optKey: "opt_banjir_kondisi_air", required: true },
    { name: "luas_genangan", label: "Estimasi Luas Genangan (m²)", type: "number", required: true },
    { name: "kondisi_cuaca_id", label: "Kondisi Cuaca Saat Ini", type: "radio", optKey: "opt_kondisi_cuaca", required: true },
  ],
  banjir_bandang: [
    { name: "kondisi_cuaca_id", label: "Kondisi Cuaca Saat Ini", type: "radio", optKey: "opt_kondisi_cuaca", required: true },
    { name: "kecepatan_air_id", label: "Kecepatan Air", type: "radio", optKey: "opt_bandang_kecepatan_air", required: true },
    { name: "kondisi_arus_id", label: "Kondisi Arus", type: "radio", optKey: "opt_bandang_kondisi_arus", required: true },
    { name: "material_terbawa_ids", label: "Material Yang Terbawa", type: "checkbox", optKey: "opt_bandang_material_terbawa", showOtherField: true, otherName: "material_terbawa_lain" },
    { name: "kerusakan_infrastruktur_ids", label: "Kerusakan Infrastruktur", type: "checkbox", optKey: "opt_bandang_kerusakan_infrastruktur", showOtherField: true, otherName: "kerusakan_infrastruktur_lain" },
  ],
  tanah_longsor: [
    { name: "kondisi_cuaca_id", label: "Kondisi Cuaca Saat Ini", type: "radio", optKey: "opt_kondisi_cuaca", required: true },
    { name: "penyebab_id", label: "Penyebab Longsor", type: "radio", optKey: "opt_longsor_penyebab", required: true, showOtherField: true, otherName: "penyebab_lain" },
    { name: "jenis_lokasi_id", label: "Jenis Lokasi Longsor", type: "radio", optKey: "opt_longsor_jenis_lokasi", required: true, showOtherField: true, otherName: "jenis_lokasi_lain" },
    { name: "dimensi_longsor", label: "Dimensi Longsor (P x L x T)", type: "text" },
    { name: "akses_transportasi_id", label: "Kondisi Akses Transportasi", type: "radio", optKey: "opt_longsor_akses_transportasi", required: true },
    { name: "material_ids", label: "Material Longsor", type: "checkbox", optKey: "opt_longsor_material", showOtherField: true, otherName: "material_lain" },
    { name: "potensi_susulan_id", label: "Potensi Susulan", type: "radio", optKey: "opt_longsor_potensi_susulan", required: true },
  ],
  cuaca_ekstrim: [
    { name: "kondisi_cuaca_id", label: "Kondisi Cuaca saat Ini", type: "radio", optKey: "opt_kondisi_cuaca", required: true },
    { name: "fenomena_id", label: "Fenomena Cuaca Ekstrim", type: "radio", optKey: "opt_cuaca_fenomena", required: true },
    { name: "dampak_pohon_id", label: "Dampak Pohon Tumbang", type: "radio", optKey: "opt_cuaca_dampak_pohon", required: true },
    { name: "kerusakan_bangunan_id", label: "Kerusakan Bangunan", type: "radio", optKey: "opt_cuaca_kerusakan_bangunan", required: true, showOtherField: true, otherName: "kerusakan_bangunan_lain" },
  ],
  kekeringan: [
    { name: "sektor_terdampak_ids", label: "Sektor Terdampak", type: "checkbox", optKey: "opt_kekeringan_sektor", required: true },
    { name: "kondisi_air_id", label: "Kondisi Air / Sumber Air", type: "radio", optKey: "opt_kekeringan_kondisi_air", required: true },
    { name: "luas_lahan", label: "Luas Lahan Terdampak (Ha)", type: "number" },
    { name: "jumlah_kk", label: "Jumlah KK Terdampak", type: "number", required: true },
    { name: "durasi_id", label: "Durasi Kekeringan", type: "radio", optKey: "opt_kekeringan_durasi", required: true },
    { name: "potensi_risiko_ids", label: "Potensi Risiko Lanjutan", type: "checkbox", optKey: "opt_kekeringan_potensi_risiko", showOtherField: true, otherName: "potensi_risiko_lain" },
    { name: "upaya_masyarakat_ids", label: "Upaya Masyarakat", type: "checkbox", optKey: "opt_kekeringan_upaya_masyarakat", showOtherField: true, otherName: "upaya_masyarakat_lain" },
  ],
  karhutla: [
    { name: "kondisi_api_id", label: "Kondisi Api Saat Ini", type: "radio", optKey: "opt_karhutla_kondisi_api", required: true },
    { name: "jenis_lahan_id", label: "Jenis Lahan", type: "radio", optKey: "opt_karhutla_jenis_lahan", required: true },
    { name: "luas_terbakar", label: "Estimasi Luas Lahan Terbakar (Ha)", type: "number" },
    { name: "pemilik_lahan_id", label: "Pemilik Lahan", type: "radio", optKey: "opt_karhutla_pemilik_lahan", required: true },
    { name: "jarak_ke_pemukiman_id", label: "Jarak ke Pemukiman Terdekat", type: "radio", optKey: "opt_karhutla_jarak_pemukiman", required: true },
    { name: "sumber_air_id", label: "Sumber Air Tersedia", type: "radio", optKey: "opt_karhutla_sumber_air", required: true },
    { name: "akses_lokasi_id", label: "Akses Menuju Lokasi", type: "radio", optKey: "opt_karhutla_akses_lokasi", required: true },
  ],
  wabah: [
    { name: "jenis_penyakit_id", label: "Jenis Penyakit / Gejala", type: "radio", optKey: "opt_wabah_jenis_penyakit", required: true, showOtherField: true, otherName: "jenis_penyakit_lain" },
    { name: "jumlah_bergejala", label: "Jumlah Warga Bergejala", type: "number", required: true },
    { name: "sebaran_id", label: "Skala Sebaran", type: "radio", optKey: "opt_wabah_sebaran", required: true, showOtherField: true, otherName: "sebaran_lain" },
    { name: "fasilitas_kesehatan_id", label: "Fasilitas Kesehatan Tersedia", type: "radio", optKey: "opt_wabah_fasilitas_kesehatan", required: true },
    { name: "kondisi_sanitasi_id", label: "Kondisi Sanitasi Lingkungan", type: "radio", optKey: "opt_wabah_kondisi_sanitasi", required: true },
    { name: "kronologi", label: "Kronologi Singkat Kejadian", type: "text" },
  ],
  gempa_bumi: [
    { name: "durasi_id", label: "Durasi Getaran", type: "radio", optKey: "opt_gempa_durasi", required: true },
    { name: "kekuatan_id", label: "Kekuatan Getaran (Dirasakan)", type: "radio", optKey: "opt_gempa_kekuatan", required: true },
    { name: "dampak_struktural_ids", label: "Dampak Struktural Bangunan", type: "checkbox", optKey: "opt_gempa_dampak_struktural", showOtherField: true, otherName: "dampak_struktural_lain" },
    { name: "kerusakan_jalan_ids", label: "Kerusakan Jalan / Infrastruktur", type: "checkbox", optKey: "opt_gempa_kerusakan_jalan", showOtherField: true, otherName: "kerusakan_jalan_lain" },
    { name: "potensi_susulan_id", label: "Ancaman & Potensi Susulan", type: "radio", optKey: "opt_gempa_potensi_susulan", required: true },
    { name: "kondisi_warga_id", label: "Kondisi Warga Saat Ini", type: "radio", optKey: "opt_gempa_kondisi_warga", required: true },
  ],
  konflik_sosial: [
    { name: "sifat_konflik_id", label: "Sifat Konflik", type: "radio", optKey: "opt_konflik_sifat", required: true, showOtherField: true, otherName: "sifat_konflik_lain" },
    { name: "aktor_id", label: "Aktor Yang Terlibat", type: "radio", optKey: "opt_konflik_aktor", required: true, showOtherField: true, otherName: "aktor_lain" },
    { name: "pemicu_id", label: "Pemicu Konflik", type: "radio", optKey: "opt_konflik_pemicu", required: true, showOtherField: true, otherName: "pemicu_lain" },
    { name: "jumlah_terlibat_id", label: "Jumlah Massa Terlibat", type: "radio", optKey: "opt_konflik_jumlah_terlibat", required: true },
    { name: "kerusakan_materil_id", label: "Kerusakan Materil", type: "radio", optKey: "opt_konflik_kerusakan_materil", required: true },
    { name: "aparat_ids", label: "Kehadiran Aparat", type: "checkbox", optKey: "opt_konflik_aparat", required: true, showOtherField: true, otherName: "aparat_lain" },
  ],
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapPicker({ position, onPick }: { position: [number,number]|null; onPick: (lat:number, lng:number)=>void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return position ? <Marker position={position} /> : null;
}

const KORBAN_FIELDS = [
  { name: "korban_luka_ringan", label: "Luka Ringan",    section: "luka" },
  { name: "korban_luka_berat",  label: "Luka Berat",     section: "luka" },
  { name: "korban_meninggal",   label: "Meninggal Dunia",section: "fatal", danger: true },
  { name: "korban_hilang",      label: "Hilang",          section: "fatal" },
  { name: "kk_mengungsi",       label: "KK Terdampak",   section: "pengungsi" },
  { name: "jiwa_mengungsi",     label: "Jiwa Mengungsi", section: "pengungsi" },
];

const FASILITAS_UMUM = [
  { id: 1, label: "Sekolah / Madrasah" },
  { id: 2, label: "Masjid / Musholla / Rumah Ibadah" },
  { id: 3, label: "Puskesmas / Pustu / RS" },
  { id: 4, label: "Kantor Pemerintahan" },
  { id: 5, label: "Pasar / Sarana Ekonomi" },
  { id: 6, label: "Jembatan / Jalan Putus" },
  { id: 7, label: "Jaringan Listrik / Telkom" },
  { id: 8, label: "Sarana Air Bersih (Pamsimas/Sumur Umum)" },
];

const LOGISTIK = [
  { id: 1, label: "Bahan Pangan" },
  { id: 2, label: "Air Bersih & Perlengkapan Sanitasi" },
  { id: 3, label: "Tenda / Terpal / Selimut" },
  { id: 4, label: "Perlengkapan Bayi" },
  { id: 5, label: "Obat-obatan & Tim Medis" },
  { id: 6, label: "Alat Berat" },
  { id: 7, label: "Perlengkapan Evakuasi" },
];

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="material-symbols-outlined text-amber-500">{icon}</span>
      <h3 className="text-base font-bold text-slate-700">{title}</h3>
    </div>
  );
}

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const FIELD_LABELS: Record<string, string> = {
  nama_pelapor: "Nama Pelapor",
  lokasi_text: "Detail Lokasi / Alamat",
  kecamatan_id: "Kecamatan",
  waktu_kejadian: "Waktu Kejadian",
  koordinat: "Koordinat GPS",
  korban_luka_ringan: "Korban Luka Ringan",
  korban_luka_berat: "Korban Luka Berat",
  korban_meninggal: "Korban Meninggal Dunia",
  korban_hilang: "Korban Hilang",
  kk_mengungsi: "KK Terdampak",
  jiwa_mengungsi: "Jiwa Mengungsi",
  rumah_rusak_berat: "Rumah Rusak Berat",
  rumah_rusak_sedang: "Rumah Rusak Sedang",
  rumah_rusak_ringan: "Rumah Rusak Ringan",
  fasilitas_terdampak: "Fasilitas Umum Terdampak",
  kebutuhan_logistik: "Kebutuhan Logistik Mendesak",
};

export default function EditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletedFotoIds, setDeletedFotoIds] = useState<number[]>([]);
  const [newFotos, setNewFotos] = useState<File[]>([]);
  const [newFotoPreviews, setNewFotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      newFotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFotoPreviews]);

  const getImageUrl = (foto: any) => {
    if (foto.file_path) {
      return foto.file_path.startsWith("/") ? foto.file_path : `/${foto.file_path}`;
    }
    return foto.url ?? "";
  };

  const isVideoFile = (foto: any) => {
    if (foto.mime_type) return foto.mime_type.startsWith("video/");
    const path = foto.file_path || "";
    const ext = path.split('.').pop()?.toLowerCase();
    return ["mp4", "webm", "ogg", "mov", "mkv", "3gp", "avi"].includes(ext);
  };

  const MAX_MEDIA_FILES = 5;
  const MAX_MEDIA_SIZE_MB = 100;
  const MAX_MEDIA_SIZE_BYTES = MAX_MEDIA_SIZE_MB * 1024 * 1024;
  const ACCEPTED_MEDIA_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "video/mp4",
    "video/quicktime",
    "video/3gpp",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const existingFotosCount = (laporan?.fotos?.length ?? 0) - deletedFotoIds.length;
    if (files.length + existingFotosCount + newFotos.length > MAX_MEDIA_FILES) {
      alert(`Maksimal ${MAX_MEDIA_FILES} file bukti yang dapat disimpan.`);
      return;
    }

    const accepted: File[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? "";
      const isAcceptedType = ACCEPTED_MEDIA_TYPES.includes(file.type) || ["jpg", "jpeg", "png", "mp4", "mov", "3gp"].includes(ext);
      if (!isAcceptedType) {
        alert(`Format file ${file.name} tidak didukung. Harap gunakan JPG, JPEG, PNG, MP4, MOV, atau 3GP.`);
        return;
      }
      if (file.size > MAX_MEDIA_SIZE_BYTES) {
        alert(`Ukuran file ${file.name} melebihi 100 MB.`);
        return;
      }
      accepted.push(file);
    }

    if (accepted.length > 0) {
      const combined = [...newFotos, ...accepted];
      setNewFotos(combined);
      setNewFotoPreviews(combined.map(f => URL.createObjectURL(f)));
    }
  };

  const removeNewFile = (index: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus media ini?")) {
      const combined = newFotos.filter((_, i) => i !== index);
      setNewFotos(combined);
      setNewFotoPreviews(combined.map(f => URL.createObjectURL(f)));
    }
  };

  const removeExistingFile = (fotoId: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus media ini?")) {
      setDeletedFotoIds(prev => [...prev, fotoId]);
    }
  };

  const [changesList, setChangesList] = useState<{ label: string; oldVal: string; newVal: string }[]>([]);

  /* ── Fetch current data ─────────────── */
  const { data: laporan, isLoading } = useQuery({
    queryKey: ["laporan-detail", id],
    queryFn: async () => { const { data } = await api.get(`/laporan/${id}`); return data; },
  });

  const { data: kecamatans = [] } = useQuery({
    queryKey: ["kecamatan-list"],
    queryFn: async () => { const { data } = await api.get("/kecamatan"); return data; },
  });

  /* ── Form state ─────────────── */
  const [geojson, setGeojson] = useState<any>(null);
  useEffect(() => {
    fetch("/MapRohul.geojson")
      .then((r) => r.json())
      .then((d) => setGeojson(d))
      .catch((e) => console.warn("GeoJSON load error:", e));
  }, []);

  const checkInPolygon = (pos: [number, number]) => {
    if (!geojson || !geojson.features) return true;
    try {
      const pt = point([pos[1], pos[0]]); // GeoJSON uses [lng, lat]
      for (const feature of geojson.features) {
        if (booleanPointInPolygon(pt, feature)) {
          return true;
        }
      }
      return false;
    } catch (e) {
      console.warn("Polygon check failed", e);
      return true;
    }
  };
  const [step1, setStep1] = useState({
    nama_pelapor: "", waktu_kejadian: "", kecamatan_id: "", lokasi_text: "",
    latitude: "", longitude: "",
  });
  const [position, setPosition] = useState<[number,number]|null>(null);
  const [korban, setKorban]       = useState<Record<string, number>>({});
  const [kerusakan, setKerusakan] = useState<Record<string, number>>({});
  const [detailData, setDetailData] = useState<Record<string, any>>({});
  const [fasilitas, setFasilitas] = useState<number[]>([]);
  const [logistik, setLogistik] = useState<number[]>([]);
  const [activeLayer, setActiveLayer] = useState<"osm"|"satellite">("satellite");

  /** Saat kecamatan diganti, pan peta ke centroid kecamatan tersebut */
  const handleKecamatanChange = (id: string) => {
    setStep1(p => ({ ...p, kecamatan_id: id }));
    const kec = (kecamatans as any[]).find((k: any) => String(k.id) === id);
    if (kec && kec.latitude_default && kec.longitude_default) {
      const newPos: [number, number] = [Number(kec.latitude_default), Number(kec.longitude_default)];
      setPosition(newPos);
      setStep1(p => ({
        ...p,
        kecamatan_id: id,
        latitude: String(Number(kec.latitude_default).toFixed(6)),
        longitude: String(Number(kec.longitude_default).toFixed(6)),
      }));
    }
  };

  // Fetch options for detail bencana (Step 2)
  const jenisBencana = laporan?.jenis_bencana;
  const { data: options } = useQuery({
    queryKey: ["options", jenisBencana],
    queryFn: async () => { const { data } = await api.get(`/options/${jenisBencana}`); return data; },
    enabled: !!jenisBencana,
  });
  const step2Fields = FIELD_CONFIGS[jenisBencana ?? ""] ?? [];

  /* Prefill saat data ready */
  useEffect(() => {
    if (!laporan) return;
    setStep1({
      nama_pelapor: laporan.nama_pelapor ?? "",
      waktu_kejadian: laporan.waktu_kejadian ? laporan.waktu_kejadian.replace(" ", "T").slice(0, 16) : "",
      kecamatan_id: String(laporan.kecamatan_id ?? ""),
      lokasi_text: laporan.lokasi_text ?? "",
      latitude:  String(laporan.latitude  ?? ""),
      longitude: String(laporan.longitude ?? ""),
    });
    if (laporan.latitude && laporan.longitude) {
      setPosition([Number(laporan.latitude), Number(laporan.longitude)]);
    }
    if (laporan.korban) setKorban({ ...laporan.korban });
    if (laporan.kerusakan) setKerusakan({ ...laporan.kerusakan });
    if (laporan.fasilitas_terdampak) {
      const fIds = laporan.fasilitas_terdampak.map((label: string) => FASILITAS_UMUM.find(f => f.label === label)?.id).filter(Boolean);
      setFasilitas(fIds as number[]);
    }
    if (laporan.kebutuhan_logistik) {
      const lIds = laporan.kebutuhan_logistik.map((label: string) => LOGISTIK.find(l => l.label === label)?.id).filter(Boolean);
      setLogistik(lIds as number[]);
    }
    // Prefill Step 2 detail bencana
    if (laporan.detail) {
      // PostgreSQL int[] comes as string "{1,2,3}" — parse back to number[]
      const parsed: Record<string, any> = {};
      Object.entries(laporan.detail).forEach(([k, v]) => {
        if (typeof v === "string" && v.startsWith("{") && v.endsWith("}")) {
          const inner = v.slice(1,-1).trim();
          parsed[k] = inner ? inner.split(",").map(s => Number(s.trim())) : [];
        } else {
          parsed[k] = v;
        }
      });
      setDetailData(parsed);
    }
  }, [laporan]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!checkInPolygon([lat, lng])) {
      alert("Peringatan: Titik koordinat berada di luar jangkauan wilayah polygon!");
      return;
    }
    setPosition([lat, lng]);
    setStep1(prev => ({ ...prev, latitude: String(lat.toFixed(6)), longitude: String(lng.toFixed(6)) }));
  };

  const formatDiffValue = (key: string, val: any) => {
    if (val === null || val === undefined || val === "") return "-";
    if (key === "kecamatan_id") {
      const kec = kecamatans.find((k: any) => String(k.id) === String(val));
      return kec ? kec.nama_kecamatan : String(val);
    }

    // Parse Postgres array string representation (e.g. "{1}" or "{1,2}")
    let parsedVal = val;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const inner = trimmed.slice(1, -1).trim();
        parsedVal = inner ? inner.split(",").map(s => Number(s.trim())) : [];
      }
    }

    const field = step2Fields.find(f => f.name === key);
    if (field?.optKey && options) {
      const list: any[] = options[field.optKey] ?? [];
      if (Array.isArray(parsedVal)) {
        return parsedVal.map((id: any) => {
          const opt = list.find((o: any) => String(o.id) === String(id));
          return opt ? opt.label : String(id);
        }).join(", ");
      }
      const opt = list.find((o: any) => String(o.id) === String(parsedVal));
      return opt ? opt.label : String(parsedVal);
    }

    if (Array.isArray(parsedVal)) {
      return parsedVal.join(", ");
    }
    return String(parsedVal);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step1.waktu_kejadian) {
      const [datePart, timePart] = step1.waktu_kejadian.split(/[T ]/);
      const today = getLocalDateString();
      if (datePart > today) {
        alert("Tanggal kejadian tidak boleh di masa depan.");
        return;
      }
      if (datePart === today) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
        if (timePart > currentTime) {
          alert("Waktu kejadian tidak boleh melebihi waktu saat ini.");
          return;
        }
      }
    }

    const jenisBencana = laporan?.jenis_bencana;
    if (jenisBencana === "banjir") {
      const luas = detailData.luas_genangan;
      if (luas !== undefined && luas !== null && luas !== "") {
        const num = Number(luas);
        if (isNaN(num) || num <= 0) {
          alert("Estimasi Luas Genangan harus lebih besar dari 0.");
          return;
        }
      }
    }
    if (jenisBencana === "tanah_longsor") {
      const dim = detailData.dimensi_longsor;
      if (dim) {
        const numbers = String(dim).match(/\d+(\.\d+)?/g);
        if (numbers) {
          for (const n of numbers) {
            if (parseFloat(n) <= 0) {
              alert("Dimensi Longsor (P x L x T) tidak boleh bernilai 0 atau negatif.");
              return;
            }
          }
        }
      }
    }

    // Generate diff list
    const diffs: { label: string; oldVal: string; newVal: string }[] = [];

    const addDiff = (key: string, oldV: any, newV: any) => {
      const vOld = Array.isArray(oldV) ? oldV.sort().join(",") : String(oldV ?? "");
      const vNew = Array.isArray(newV) ? newV.sort().join(",") : String(newV ?? "");
      
      if (vOld !== vNew && !(vOld === "" && vNew === "")) {
        const label = FIELD_LABELS[key] || step2Fields.find(f => f.name === key)?.label || key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        diffs.push({
          label,
          oldVal: formatDiffValue(key, oldV),
          newVal: formatDiffValue(key, newV)
        });
      }
    };

    addDiff("nama_pelapor", laporan.nama_pelapor, step1.nama_pelapor);
    addDiff("lokasi_text", laporan.lokasi_text, step1.lokasi_text);
    addDiff("kecamatan_id", laporan.kecamatan_id, Number(step1.kecamatan_id));

    const normalizeDateTime = (dtStr: string) => {
      if (!dtStr) return "";
      return dtStr.replace(" ", "T").slice(0, 16);
    };
    addDiff("waktu_kejadian", normalizeDateTime(laporan.waktu_kejadian), normalizeDateTime(step1.waktu_kejadian));

    const reqLat = position?.[0] ?? Number(step1.latitude);
    const reqLng = position?.[1] ?? Number(step1.longitude);
    if (reqLat !== Number(laporan.latitude) || reqLng !== Number(laporan.longitude)) {
      diffs.push({
        label: "Koordinat GPS",
        oldVal: `${Number(laporan.latitude).toFixed(5)}, ${Number(laporan.longitude).toFixed(5)}`,
        newVal: `${reqLat.toFixed(5)}, ${reqLng.toFixed(5)}`
      });
    }

    Object.keys(korban).forEach(k => {
      addDiff(k, laporan.korban?.[k] ?? 0, korban[k]);
    });

    Object.keys(kerusakan).forEach(k => {
      const curr = laporan.kerusakan?.[k] ?? (typeof kerusakan[k] === 'string' ? "" : 0);
      addDiff(k, curr, kerusakan[k]);
    });

    Object.keys(detailData).forEach(k => {
      addDiff(k, laporan.detail?.[k], detailData[k]);
    });

    const oldFLabels = laporan.fasilitas_terdampak || [];
    const newFLabels = fasilitas.map(id => FASILITAS_UMUM.find(f => f.id === id)?.label).filter(Boolean);
    addDiff("fasilitas_terdampak", oldFLabels, newFLabels);
    
    const oldLLabels = laporan.kebutuhan_logistik || [];
    const newLLabels = logistik.map(id => LOGISTIK.find(x => x.id === id)?.label).filter(Boolean);
    addDiff("kebutuhan_logistik", oldLLabels, newLLabels);

    if (deletedFotoIds.length > 0) {
      diffs.push({
        label: "Media Dihapus",
        oldVal: `${deletedFotoIds.length} file`,
        newVal: `Dihapus dari laporan`
      });
    }
    if (newFotos.length > 0) {
      diffs.push({
        label: "Media Baru Ditambahkan",
        oldVal: "-",
        newVal: `${newFotos.length} file baru`
      });
    }

    if (diffs.length === 0) {
      alert("Tidak ada data yang diubah.");
      return;
    }

    setChangesList(diffs);
    setShowConfirmModal(true);
  };

  const executeSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);

    const changed: string[] = [];
    const oldVal: Record<string, any> = {};
    const newVal: Record<string, any> = {};

    const addDiff = (key: string, oldV: any, newV: any) => {
      const vOld = Array.isArray(oldV) ? oldV.sort().join(",") : String(oldV ?? "");
      const vNew = Array.isArray(newV) ? newV.sort().join(",") : String(newV ?? "");
      
      if (vOld !== vNew && !(vOld === "" && vNew === "")) {
        changed.push(key);
        oldVal[key] = Array.isArray(oldV) ? oldV : (oldV ?? null);
        newVal[key] = Array.isArray(newV) ? newV : (newV ?? null);
      }
    };

    addDiff("nama_pelapor", laporan.nama_pelapor, step1.nama_pelapor);
    addDiff("lokasi_text", laporan.lokasi_text, step1.lokasi_text);
    addDiff("kecamatan_id", laporan.kecamatan_id, Number(step1.kecamatan_id));

    const normalizeDateTime = (dtStr: string) => {
      if (!dtStr) return "";
      return dtStr.replace(" ", "T").slice(0, 16);
    };
    addDiff("waktu_kejadian", normalizeDateTime(laporan.waktu_kejadian), normalizeDateTime(step1.waktu_kejadian));

    const reqLat = position?.[0] ?? Number(step1.latitude);
    const reqLng = position?.[1] ?? Number(step1.longitude);
    if (reqLat !== Number(laporan.latitude) || reqLng !== Number(laporan.longitude)) {
      changed.push("koordinat");
      oldVal.koordinat = `${laporan.latitude}, ${laporan.longitude}`;
      newVal.koordinat = `${reqLat}, ${reqLng}`;
    }

    Object.keys(korban).forEach(k => {
      addDiff(k, laporan.korban?.[k] ?? 0, korban[k]);
    });

    Object.keys(kerusakan).forEach(k => {
      const curr = laporan.kerusakan?.[k] ?? (typeof kerusakan[k] === 'string' ? "" : 0);
      addDiff(k, curr, kerusakan[k]);
    });

    Object.keys(detailData).forEach(k => {
      addDiff(k, laporan.detail?.[k], detailData[k]);
    });

    const oldFLabels = laporan.fasilitas_terdampak || [];
    const newFLabels = fasilitas.map(id => FASILITAS_UMUM.find(f => f.id === id)?.label).filter(Boolean);
    addDiff("fasilitas_terdampak", oldFLabels, newFLabels);
    
    const oldLLabels = laporan.kebutuhan_logistik || [];
    const newLLabels = logistik.map(id => LOGISTIK.find(x => x.id === id)?.label).filter(Boolean);
    addDiff("kebutuhan_logistik", oldLLabels, newLLabels);

    if (deletedFotoIds.length > 0 || newFotos.length > 0) {
      changed.push("media");
      oldVal.media = `${(laporan.fotos || []).length} file`;
      newVal.media = `${(laporan.fotos || []).length - deletedFotoIds.length + newFotos.length} file`;
    }

    const audit_log = changed.length > 0 ? {
      action_type: "update",
      field_changed: changed,
      old_value: oldVal,
      new_value: newVal,
      catatan: "Update detail laporan dari Editor"
    } : null;

    try {
      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("nama_pelapor", step1.nama_pelapor);
      fd.append("waktu_kejadian", step1.waktu_kejadian);
      fd.append("kecamatan_id", String(step1.kecamatan_id));
      fd.append("lokasi_text", step1.lokasi_text);
      fd.append("latitude", String(reqLat));
      fd.append("longitude", String(reqLng));
      fd.append("korban", JSON.stringify(korban));
      fd.append("kerusakan", JSON.stringify(kerusakan));
      fd.append("detail_bencana", JSON.stringify(detailData));
      fd.append("fasilitas_terdampak", JSON.stringify(fasilitas));
      fd.append("kebutuhan_logistik", JSON.stringify(logistik));
      fd.append("deleted_foto_ids", JSON.stringify(deletedFotoIds));
      
      newFotos.forEach(f => fd.append("fotos[]", f));

      if (audit_log) {
        fd.append("audit_log", JSON.stringify(audit_log));
      }

      await api.post(`/laporan/${id}`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSaved(true);
      setTimeout(() => navigate(`/detail/${id}`), 2000);
    } catch (error) {
      console.error("Gagal update detail:", error);
      alert("Terjadi kesalahan saat mengupdate laporan.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent" />
    </div>
  );

  const jenisLabel = laporan?.jenis_bencana?.replace(/_/g, " ")?.toUpperCase() ?? "—";

  return (
    <div className="bg-[#F8F9FA] min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <SipenaNav />
      <NewsTicker />

      <main className="mt-[104px] pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 pt-2">
            <button onClick={() => navigate("/rekap")} className="hover:text-amber-600">Rekap</button>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <button onClick={() => navigate(`/detail/${id}`)} className="hover:text-amber-600">#{id}</button>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-slate-800 font-semibold">Edit Detail Kejadian</span>
          </div>

          {/* Info Header */}
          <div className="bg-[#1C1F2B] text-white rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-amber-400 text-2xl">crisis_alert</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Edit Detail Laporan #{id}</p>
              <h1 className="text-lg font-bold">{jenisLabel}</h1>
              <p className="text-sm text-slate-400">Perubahan akan disimpan ke database dan dicatat dalam log.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── STEP 1: Identitas & Lokasi ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-amber-500" />
              <div className="p-6">
                <SectionHeader icon="person_pin_circle" title="Identitas & Lokasi Kejadian" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Pelapor</label>
                      <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                        value={step1.nama_pelapor} onChange={e => setStep1(p=>({...p, nama_pelapor: e.target.value}))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tanggal & Waktu Kejadian</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input required type="date" max={getLocalDateString()}
                          className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 outline-none h-[42px] sm:h-auto"
                          value={step1.waktu_kejadian ? step1.waktu_kejadian.split(/[T ]/)[0] : ""}
                          onChange={e => {
                            const selectedVal = e.target.value;
                            const maxVal = getLocalDateString();
                            if (selectedVal > maxVal) {
                              alert("Tanggal kejadian tidak boleh di masa depan!");
                              const timePart = step1.waktu_kejadian ? (step1.waktu_kejadian.split(/[T ]/)[1] || "00:00") : "00:00";
                              setStep1(p => ({ ...p, waktu_kejadian: `${maxVal}T${timePart}` }));
                              return;
                            }
                            const timePart = step1.waktu_kejadian ? (step1.waktu_kejadian.split(/[T ]/)[1] || "00:00") : "00:00";
                            if (selectedVal === maxVal) {
                              const now = new Date();
                              const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
                              if (timePart.slice(0, 5) > currentTime) {
                                alert("Waktu kejadian melebihi waktu saat ini! Waktu disesuaikan ke jam sekarang.");
                                setStep1(p => ({ ...p, waktu_kejadian: `${selectedVal}T${currentTime}` }));
                                return;
                              }
                            }
                            setStep1(p => ({ ...p, waktu_kejadian: `${selectedVal}T${timePart.slice(0,5)}` }));
                          }} />
                        <TimeInput
                          value={step1.waktu_kejadian ? (step1.waktu_kejadian.split(/[T ]/)[1]?.slice(0, 5) || "") : ""}
                          dateVal={step1.waktu_kejadian ? (step1.waktu_kejadian.split(/[T ]/)[0] || getLocalDateString()) : getLocalDateString()}
                          onChange={val => {
                            const datePart = step1.waktu_kejadian ? step1.waktu_kejadian.split(/[T ]/)[0] : getLocalDateString();
                            setStep1(p => ({ ...p, waktu_kejadian: `${datePart}T${val}` }));
                          }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Gunakan jam scroll-wheel di sebelah kanan untuk memilih jam.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kecamatan</label>
                      <select required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                        value={step1.kecamatan_id} onChange={e => handleKecamatanChange(e.target.value)}>
                        <option value="">-- Pilih Kecamatan --</option>
                        {(kecamatans as any[]).map((k: any) => <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Detail Lokasi / Alamat</label>
                      <textarea required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 outline-none resize-none h-20"
                        value={step1.lokasi_text} onChange={e => setStep1(p=>({...p, lokasi_text: e.target.value}))} />
                    </div>
                    {/* Manual Koordinat */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Latitude</label>
                        <input type="number" step="0.000001" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                          value={step1.latitude}
                          onChange={e => { setStep1(p=>({...p, latitude: e.target.value})); const lat=parseFloat(e.target.value); const lng=parseFloat(step1.longitude); if(!isNaN(lat)&&!isNaN(lng)) { if(!checkInPolygon([lat, lng])) alert("Di luar polygon"); else setPosition([lat, lng]); } }} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Longitude</label>
                        <input type="number" step="0.000001" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                          value={step1.longitude}
                          onChange={e => { setStep1(p=>({...p, longitude: e.target.value})); const lat=parseFloat(step1.latitude); const lng=parseFloat(e.target.value); if(!isNaN(lat)&&!isNaN(lng)) { if(!checkInPolygon([lat, lng])) alert("Di luar polygon"); else setPosition([lat, lng]); } }} />
                      </div>
                    </div>
                  </div>

                  {/* Map column */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pin Lokasi</label>
                      <div style={{ display: "flex", overflow: "hidden", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                        {(["satellite", "osm"] as const).map((layer) => (
                          <button key={`layer-edit-${layer}`} type="button" onClick={() => setActiveLayer(layer)} style={{
                            padding: "4px 10px", fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                            background: activeLayer === layer ? "#F39200" : "white",
                            color: activeLayer === layer ? "white" : "#64748B", textTransform: "uppercase",
                          }}>
                            {layer === "osm" ? "Peta" : "Satelit"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: 280, borderRadius: 12, overflow: "hidden", border: "2px solid #E2E8F0" }}>
                      <MapContainer center={position ?? [0.95, 100.25]} zoom={10} minZoom={5} maxZoom={activeLayer === "satellite" ? 17 : 19} maxBounds={[[6.0, 95.0], [-6.0, 109.0]]} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                        <TileLayer key={`base-edit-${activeLayer}`}
                          url={activeLayer === "satellite"
                            ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                          maxZoom={activeLayer === "satellite" ? 17 : 19} />
                        {activeLayer === "satellite" && <TileLayer key="labels-satellite-edit" url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" pane="shadowPane" />}
                        {geojson && (geojson.features?.length ?? 0) > 0 && (
                          <GeoJSON
                            key={`boundary-edit-${activeLayer}-${geojson.features.length}`}
                            data={geojson as any}
                            style={{
                              color: activeLayer === "satellite" ? "#FACC15" : "#1E40AF",
                              weight: 2.5, opacity: 1,
                              fillColor: activeLayer === "satellite" ? "#FACC15" : "#3B82F6",
                              fillOpacity: 0.07, dashArray: "4 3",
                            }}
                            onEachFeature={(feature, layer) => {
                              const name = feature.properties?.NAMOBJ ?? feature.properties?.nama_kecamatan ?? "";
                              if (name) layer.bindTooltip(name, { permanent: false, direction: "center" });
                            }}
                          />
                        )}
                        {/* Auto-pan saat kecamatan berubah */}
                        <FlyToPosition position={position} />
                        <MapPicker position={position} onPick={handleMapClick} />
                      </MapContainer>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">info</span>
                      Klik peta untuk ubah koordinat, atau edit manual di atas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── STEP 2: Detail Bencana (dynamic) ── */}
            {step2Fields.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-1 bg-blue-500" />
                <div className="p-6">
                  <SectionHeader icon="crisis_alert" title={`Detail Bencana: ${jenisBencana?.replace(/_/g," ")?.toUpperCase() ?? ""}`} />
                  {!options ? (
                    <div className="text-slate-400 text-sm animate-pulse">Memuat opsi...</div>
                  ) : (
                    <div className="space-y-6">
                      {step2Fields.map(field => {
                        const opts: any[] = options?.[field.optKey!] ?? [];
                        const otherOpt = opts.find(o => o.is_other);
                        const currentArr: number[] = Array.isArray(detailData[field.name]) ? detailData[field.name] : [];
                        const showOther = field.showOtherField && otherOpt && (
                          field.type === "checkbox" ? currentArr.includes(otherOpt.id) : detailData[field.name] == otherOpt.id
                        );
                        return (
                          <div key={field.name}>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                              {field.label} {field.required && <span className="text-red-400">*</span>}
                            </label>
                            {field.type === "checkbox" && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {opts.map(opt => (
                                  <label key={opt.id} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm transition-all ${
                                    currentArr.includes(opt.id) ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                                  }`}>
                                    <input type="checkbox" className="w-4 h-4"
                                      checked={currentArr.includes(opt.id)}
                                      onChange={() => {
                                        const next = currentArr.includes(opt.id)
                                          ? currentArr.filter(v => v !== opt.id)
                                          : [...currentArr, opt.id];
                                        setDetailData(p => ({ ...p, [field.name]: next }));
                                      }} />
                                    {opt.label}
                                  </label>
                                ))}
                              </div>
                            )}
                            {field.type === "radio" && (
                              <div className="flex flex-wrap gap-2">
                                {opts.map(opt => (
                                  <label key={opt.id} className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-all ${
                                    detailData[field.name] == opt.id ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                                  }`}>
                                    <input type="radio" name={field.name} className="w-4 h-4"
                                      checked={detailData[field.name] == opt.id}
                                      onChange={() => setDetailData(p => ({ ...p, [field.name]: opt.id }))} />
                                    {opt.label}
                                  </label>
                                ))}
                              </div>
                            )}
                            {(field.type === "text" || field.type === "number") && (
                              <input
                                type={field.type === "number" ? "number" : "text"}
                                min={field.type === "number" ? 0 : undefined}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                value={detailData[field.name] ?? ""}
                                onChange={e => {
                                  let val = e.target.value;
                                  if (field.name === "dimensi_longsor") {
                                    val = val.replace(/[^0-9xX., ]/g, '');
                                  } else if (field.type === "number") {
                                    val = val.replace(/[^0-9]/g, '');
                                    const slicedVal = val.slice(0, 9);
                                    let cleanVal = slicedVal;
                                    if (cleanVal !== "") {
                                      cleanVal = cleanVal.replace(/^0+(?=\d)/, '');
                                    }
                                    val = cleanVal;
                                  }
                                  setDetailData(p => ({ ...p, [field.name]: val }));
                                }}
                                onKeyDown={field.type === "number" ? (e) => { if (["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault(); } : undefined}
                                placeholder={field.type === "number" ? "0" : "Masukkan nilai..."}
                              />
                            )}
                            {showOther && field.otherName && (
                              <input type="text" className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                value={detailData[field.otherName] ?? ""}
                                onChange={e => setDetailData(p => ({ ...p, [field.otherName!]: e.target.value }))}
                                placeholder="Sebutkan lainnya..." />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 3: Korban ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-orange-500" />
              <div className="p-6">
                <SectionHeader icon="group" title="Data Korban Jiwa" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {KORBAN_FIELDS.map(f => (
                    <div key={f.name}>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{f.label}</label>
                      <input type="number" min={0}
                        className={`w-full border-2 rounded-xl py-2.5 px-4 text-lg font-bold focus:ring-2 outline-none transition-all ${
                          (f as any).danger ? "bg-red-50 border-red-200 focus:ring-red-400 text-red-700" : "bg-slate-50 border-slate-200 focus:ring-amber-400"
                        }`}
                        value={korban[f.name] ?? 0}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          const slicedVal = val.slice(0, 9);
                          const cleanVal = slicedVal === "" ? 0 : Number(slicedVal);
                          setKorban(prev => ({ ...prev, [f.name]: cleanVal }));
                        }}
                        onKeyDown={e => { if (["e","E","+","-",".",","].includes(e.key)) e.preventDefault(); }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── STEP 4: Kerusakan ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-red-500" />
              <div className="p-6">
                <SectionHeader icon="home_work" title="Kerusakan Rumah" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[["rumah_rusak_ringan","Rusak Ringan"],["rumah_rusak_sedang","Rusak Sedang"],["rumah_rusak_berat","Rusak Berat"]].map(([name, label]) => (
                    <div key={name}>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
                      <input type="number" min={0} placeholder="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-mono text-lg focus:ring-2 focus:ring-amber-400 outline-none"
                        value={kerusakan[name] ?? 0}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          const slicedVal = val.slice(0, 9);
                          const cleanVal = slicedVal === "" ? 0 : Number(slicedVal);
                          setKerusakan(prev => ({ ...prev, [name]: cleanVal }));
                        }}
                        onKeyDown={e => { if (["e","E","+","-",".",","].includes(e.key)) e.preventDefault(); }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Fasilitas & Logistik ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-blue-500" />
              <div className="p-6">
                <SectionHeader icon="domain" title="Fasilitas & Logistik" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fasilitas */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Fasilitas Umum Terdampak</label>
                    <div className="grid grid-cols-1 gap-2">
                      {FASILITAS_UMUM.map(opt => (
                        <label key={opt.id} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm transition-all ${
                          fasilitas.includes(opt.id) ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                        }`}>
                          <input type="checkbox" className="w-4 h-4"
                            checked={fasilitas.includes(opt.id)}
                            onChange={() => {
                              const next = fasilitas.includes(opt.id) ? fasilitas.filter(v => v !== opt.id) : [...fasilitas, opt.id];
                              setFasilitas(next);
                            }} />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Logistik */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Kebutuhan Logistik Mendesak</label>
                    <div className="grid grid-cols-1 gap-2">
                      {LOGISTIK.map(opt => (
                        <label key={opt.id} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm transition-all ${
                          logistik.includes(opt.id) ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                        }`}>
                          <input type="checkbox" className="w-4 h-4"
                            checked={logistik.includes(opt.id)}
                            onChange={() => {
                              const next = logistik.includes(opt.id) ? logistik.filter(v => v !== opt.id) : [...logistik, opt.id];
                              setLogistik(next);
                            }} />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── STEP 5: Edit Media (Dokumentasi) ── */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-violet-500" />
              <div className="p-6">
                <SectionHeader icon="photo_camera" title="Dokumentasi Media Laporan" />
                
                {/* Media yang sudah diupload sebelumnya */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Media Sebelumnya / Tim TRS</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {(laporan?.fotos || [])
                      .filter((f: any) => !deletedFotoIds.includes(f.id))
                      .map((foto: any, idx: number) => {
                        const isVid = isVideoFile(foto);
                        const uploadDate = foto.created_at ? new Date(foto.created_at).toLocaleDateString("id-ID") : "-";
                        return (
                          <div key={foto.id || idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-50 flex flex-col justify-between">
                            <div className="relative flex-1 overflow-hidden">
                              {isVid ? (
                                <video src={getImageUrl(foto)} className="w-full h-full object-cover" />
                              ) : (
                                <img src={getImageUrl(foto)} className="w-full h-full object-cover" alt="" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeExistingFile(foto.id)}
                                className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 duration-200 z-10"
                                title="Hapus Media"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                            <div className="p-2 bg-slate-900/80 text-white text-[9px] font-medium leading-tight truncate text-center">
                              <span className="block truncate font-bold">{foto.file_name || "media_file"}</span>
                              <span className="block text-slate-400 mt-0.5">{uploadDate}</span>
                            </div>
                          </div>
                        );
                      })}
                    {/* Jika semua media sebelumnya terhapus / kosong */}
                    {(laporan?.fotos || []).filter((f: any) => !deletedFotoIds.includes(f.id)).length === 0 && (
                      <div className="col-span-full py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        Tidak ada media sebelumnya yang aktif.
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload media baru */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tambah Media Baru</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      MAKS. {MAX_MEDIA_FILES - ((laporan?.fotos || []).length - deletedFotoIds.length)} FILE LAGI
                    </span>
                  </div>

                  <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-amber-600">cloud_upload</span>
                    </div>
                    <div className="text-center px-4">
                      <p className="font-semibold text-slate-700 text-sm">Klik untuk tambah media baru atau seret file</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Total media keseluruhan tidak boleh lebih dari 5 file. Format: JPG, JPEG, PNG, MP4, MOV, atau 3GP. Maksimal 100 MB per file.
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/jpeg,image/png,video/mp4,video/quicktime,video/3gpp"
                      onChange={handleFileChange}
                    />
                  </label>

                  {newFotoPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
                      {newFotoPreviews.map((url, i) => {
                        const isVideo = newFotos[i]?.type.startsWith("video/");
                        return (
                          <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-50">
                            {isVideo ? (
                              <video src={url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={url} className="w-full h-full object-cover" alt="" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeNewFile(i)}
                              className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 duration-200 z-10"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-amber-500 text-white text-[9px] font-bold text-center uppercase tracking-wide">
                              Baru
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pb-4">
              <button type="button" onClick={() => navigate(`/detail/${id}`)}
                className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 text-sm">
                Batal
              </button>
              <button type="submit" disabled={saving || saved}
                className={`flex-1 px-5 py-3 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2
                  ${saved ? "bg-green-500" : "bg-[#F39200] hover:brightness-110"}`}>
                {saved ? (<><span className="material-symbols-outlined text-[20px]">check_circle</span>Tersimpan!</>)
                  : saving ? (<><div className="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent" />Menyimpan...</>)
                  : (<><span className="material-symbols-outlined text-[20px]">save</span>Simpan Perubahan</>)}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-500" />
            <div className="p-6 sm:p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">edit_document</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Konfirmasi Perubahan</h3>
                  <p className="text-xs text-slate-400">Berikut adalah daftar data yang Anda ubah:</p>
                </div>
              </div>

              {/* Table of Changes */}
              <div className="max-h-[300px] overflow-y-auto rounded-xl border border-slate-200 mb-6 custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-1/3">Kolom</th>
                      <th className="p-3 text-red-600">Sebelum</th>
                      <th className="p-3 text-emerald-700">Sesudah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {changesList.map((ch, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-600">{ch.label}</td>
                        <td className="p-3 text-red-500 bg-red-50/20 break-words">{ch.oldVal}</td>
                        <td className="p-3 text-emerald-600 font-semibold bg-emerald-50/20 break-words">{ch.newVal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                Apakah Anda yakin ingin menyimpan perubahan di atas? Perubahan ini akan dicatat ke audit log sistem.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-600 text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeSave}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">done</span>
                  Ya, Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
