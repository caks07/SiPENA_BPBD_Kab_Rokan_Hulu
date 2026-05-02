import { useQuery } from "@tanstack/react-query";
import { useFormStore } from "../../state/useFormStore";
import api from "../../api/client";

// Config per jenis_bencana: field name → { label, type, optKey, required }
type FieldConfig = {
  name: string;
  label: string;
  type: "radio" | "checkbox" | "text" | "number" | "select";
  optKey?: string;
  required?: boolean;
  showOtherField?: boolean;
  otherName?: string;
  unit?: string;
};

const FIELD_CONFIGS: Record<string, FieldConfig[]> = {
  banjir: [
    { name: "penyebab_ids", label: "Kronologi Kejadian (Penyebab)", type: "checkbox", optKey: "opt_banjir_penyebab", required: true, showOtherField: true, otherName: "penyebab_lain" },
    { name: "ketinggian_banjir_id", label: "Ketinggian Banjir", type: "radio", optKey: "opt_banjir_ketinggian", required: true, showOtherField: true, otherName: "ketinggian_banjir_lain" },
    { name: "kondisi_air_id", label: "Kondisi Air Saat Ini", type: "radio", optKey: "opt_banjir_kondisi_air", required: true },
    { name: "luas_genangan", label: "Estimasi Luas Genangan", type: "text", required: true },
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

export default function Step2DetailBencana() {
  const { jenis_bencana, detail, setDetail, nextStep, prevStep } = useFormStore();

  const { data: options, isLoading } = useQuery({
    queryKey: ["options", jenis_bencana],
    queryFn: async () => { const { data } = await api.get(`/options/${jenis_bencana}`); return data; },
    enabled: !!jenis_bencana,
  });

  const fields = FIELD_CONFIGS[jenis_bencana] ?? [];

  const setField = (name: string, value: any) => setDetail({ [name]: value });

  const toggleCheckbox = (name: string, id: number) => {
    const current: number[] = Array.isArray(detail[name]) ? detail[name] : [];
    setField(name, current.includes(id) ? current.filter((v: number) => v !== id) : [...current, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const renderField = (field: FieldConfig) => {
    const opts: any[] = options?.[field.optKey!] ?? [];
    const hasOther = opts.some(o => o.is_other);
    const currentArr: number[] = Array.isArray(detail[field.name]) ? detail[field.name] : [];
    const otherOpt = opts.find(o => o.is_other);
    const showOther = field.showOtherField && otherOpt && (
      field.type === "checkbox" ? currentArr.includes(otherOpt.id) : detail[field.name] == otherOpt.id
    );

    return (
      <div key={field.name} className="space-y-3 mb-8">
        <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          {field.label} {field.required && <span className="text-red-500 text-sm">*</span>}
        </label>

        {field.type === "checkbox" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {opts.map(opt => (
              <label key={opt.id} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${currentArr.includes(opt.id) ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="checkbox" className="w-5 h-5 rounded text-amber-500 focus:ring-amber-400"
                  checked={currentArr.includes(opt.id)}
                  onChange={() => toggleCheckbox(field.name, opt.id)} />
                <span className="text-slate-800">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === "radio" && (
          <div className={opts.length <= 3 ? "flex flex-col sm:flex-row gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
            {opts.map(opt => (
              <label key={opt.id} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${detail[field.name] == opt.id ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="radio" name={field.name} className="w-5 h-5 text-amber-500 focus:ring-amber-400"
                  checked={detail[field.name] == opt.id}
                  onChange={() => setField(field.name, opt.id)} />
                <span className="text-slate-800">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {(field.type === "text" || field.type === "number") && (
          <input
            type={field.type}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400 outline-none"
            value={detail[field.name] || ""}
            onChange={e => setField(field.name, e.target.value)}
            onKeyDown={field.type === "number"
              ? (e) => { if (["e","E","+","-",".",","].includes(e.key)) e.preventDefault(); }
              : undefined
            }
            placeholder={field.type === "number" ? "0" : "Masukkan nilai..."}
          />
        )}

        {showOther && field.otherName && (
          <div className="mt-2">
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400 outline-none"
              value={detail[field.otherName] || ""} onChange={e => setField(field.otherName!, e.target.value)}
              placeholder="Sebutkan lainnya..." />
          </div>
        )}
      </div>
    );
  };

  if (isLoading) return (
    <div className="bg-white/90 rounded-2xl p-12 text-center">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent mx-auto mb-4" />
      <p className="text-slate-500">Memuat form bencana...</p>
    </div>
  );

  return (
    // pb-28 agar konten terakhir tidak tertutup footer fixed
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg p-6 md:p-8 pb-28">
      <div className="border-t-8 border-amber-500 -mx-6 md:-mx-8 -mt-6 md:-mt-8 pt-6 px-6 md:px-8 mb-6 rounded-t-2xl">
        <h2 className="text-2xl font-bold text-slate-800 mt-2">Detail Bencana: {jenis_bencana.replace(/_/g, " ").toUpperCase()}</h2>
        <p className="text-slate-500 text-sm mt-1">Harap lengkapi informasi teknis mengenai kondisi bencana di lokasi kejadian.</p>
        <hr className="mt-4 border-slate-200" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          {fields.map(renderField)}
        </div>

        {/* Bottom Nav */}
        <div className="mt-8 flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <button type="button" onClick={prevStep} className="flex items-center gap-2 text-slate-500 px-6 py-3 hover:bg-slate-100 rounded-xl transition-all active:scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-bold uppercase tracking-wider">Kembali</span>
          </button>
          <div className="text-slate-400 font-bold uppercase text-sm">Langkah 2/4</div>
          <button type="submit" className="flex items-center gap-2 bg-amber-500 text-white rounded-xl px-6 py-3 active:scale-95 transition-transform shadow-md">
            <span className="text-sm font-bold uppercase tracking-wider">Lanjut</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
