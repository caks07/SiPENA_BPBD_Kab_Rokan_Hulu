import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormStore } from "../../state/useFormStore";
import api from "../../api/client";

const FASILITAS_UMUM = [
  { id: 1, label: "Sekolah / Madrasah" },
  { id: 2, label: "Masjid / Musholla / Rumah Ibadah" },
  { id: 3, label: "Puskesmas / Pustu / RS" },
  { id: 4, label: "Kantor Pemerintahan" },
  { id: 5, label: "Pasar / Sarana Ekonomi" },
  { id: 6, label: "Jembatan / Jalan Putus" },
  { id: 7, label: "Jaringan Listrik / Telkom" },
  { id: 8, label: "Sarana Air Bersih (Pamsimas/Sumur Umum)" },
  { id: 9, label: "Yang lain:", isOther: true },
];

const LOGISTIK = [
  { id: 1, label: "Bahan Pangan" },
  { id: 2, label: "Air Bersih & Perlengkapan Sanitasi" },
  { id: 3, label: "Tenda / Terpal / Selimut" },
  { id: 4, label: "Perlengkapan Bayi" },
  { id: 5, label: "Obat-obatan & Tim Medis" },
  { id: 6, label: "Alat Berat" },
  { id: 7, label: "Perlengkapan Evakuasi" },
  { id: 8, label: "Yang lain:", isOther: true },
];

/** Modal sukses yang tampil setelah laporan berhasil disubmit */
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeIn_0.3s_ease]">
        {/* Top accent bar */}
        <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500" />
        <div className="p-8 flex flex-col items-center text-center">
          {/* Icon lingkaran besar */}
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6 relative">
            <span className="material-symbols-outlined text-green-500 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
            {/* Ring animasi */}
            <div className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping opacity-30" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">Laporan Berhasil Dikirim!</h2>
          <p className="text-slate-500 text-sm mb-2">
            Data bencana telah berhasil disimpan ke sistem SiPENA dan siap diverifikasi oleh petugas.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 w-full mb-6">
            <p className="text-green-700 text-xs font-semibold flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">verified</span>
              Status: Siaga 1 — Menunggu verifikasi BPBD
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-amber-500 text-white font-bold py-3 px-6 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal loading saat proses pengiriman laporan */
function SubmittingModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeIn_0.3s_ease]">
        {/* Top accent bar */}
        <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-500 animate-[loading_1.5s_infinite_linear]" />
        <div className="p-8 flex flex-col items-center text-center">
          {/* Circular Spinner */}
          <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center mb-6 relative">
            <div className="animate-spin w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">Mengirim Laporan...</h2>
          <p className="text-slate-500 text-sm">
            Harap tunggu sebentar, data laporan dan media bukti sedang diunggah ke server.
          </p>
        </div>
      </div>
    </div>
  );
}

const MAX_MEDIA_FILES = 5;
const MAX_MEDIA_SIZE_MB = 100;
const MAX_MEDIA_SIZE_BYTES = MAX_MEDIA_SIZE_MB * 1024 * 1024;

const ACCEPTED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/quicktime",
  "video/3gpp",
];

export default function Step4KerusakanFoto() {
  const navigate = useNavigate();
  const { laporan, detail, korban, kerusakan, setKerusakan, fotos, setFotos, prevStep, jenis_bencana, resetForm } = useFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fasilitasIds, setFasilitasIds] = useState<number[]>([]);
  const [logistikIds, setLogistikIds] = useState<number[]>([]);
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);

  // Cleanup object URLs on unmount to prevent leaks
  useEffect(() => {
    return () => {
      fotoPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const toggle = (list: number[], setList: (v: number[]) => void, id: number) => {
    setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    if (newFiles.length + fotos.length > MAX_MEDIA_FILES) {
      alert("Maksimal 5 file bukti yang dapat diunggah.");
      return;
    }

    const accepted: File[] = [];
    for (const file of newFiles) {
      if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
        alert(`Format file ${file.name} tidak didukung. Harap gunakan JPG, JPEG, PNG, MP4, MOV, atau 3GP.`);
        return;
      }
      if (file.size > MAX_MEDIA_SIZE_BYTES) {
        if (file.type.startsWith("video/")) {
          alert(`Ukuran file ${file.name} melebihi 100 MB atau durasi video terlalu panjang.`);
        } else {
          alert(`Ukuran file ${file.name} melebihi 100 MB.`);
        }
        return;
      }
      accepted.push(file);
    }

    if (accepted.length > 0) {
      const combined = [...fotos, ...accepted].slice(0, 5);
      setFotos(combined);
      setFotoPreviews(combined.map(f => URL.createObjectURL(f)));
    }
  };

  const removeFile = (index: number) => {
    const newFotos = fotos.filter((_, i) => i !== index);
    setFotos(newFotos);
    setFotoPreviews(newFotos.map(f => URL.createObjectURL(f)));
  };

  const sanitizeData = (data: Record<string, any>, defaultNumericKeys: string[] = []) => {
    const cleaned: Record<string, any> = {};
    defaultNumericKeys.forEach(k => {
      cleaned[k] = 0;
    });
    for (const k in data) {
      const v = data[k];
      if (v === "" || v === null || v === undefined) {
        if (!defaultNumericKeys.includes(k)) {
          cleaned[k] = null;
        }
      } else if (Array.isArray(v)) {
        cleaned[k] = v;
      } else if (!isNaN(Number(v))) {
        cleaned[k] = Number(v);
      } else {
        cleaned[k] = v;
      }
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Ambil form access token dari sessionStorage
    const formToken = sessionStorage.getItem('sipena_form_access_token');
    if (!formToken) {
      alert('Sesi akses form telah berakhir. Muat ulang halaman dan masukkan password kembali.');
      sessionStorage.removeItem('sipena_form_access_token');
      window.location.reload();
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("laporan", JSON.stringify({ ...laporan, jenis_bencana }));
      fd.append("detail_bencana", JSON.stringify(sanitizeData(detail)));
      fd.append("korban", JSON.stringify(sanitizeData(korban, ["korban_luka_ringan", "korban_luka_berat", "korban_meninggal", "korban_hilang", "kk_mengungsi", "jiwa_mengungsi"])));
      fd.append("kerusakan", JSON.stringify(sanitizeData(kerusakan, ["rumah_rusak_ringan", "rumah_rusak_sedang", "rumah_rusak_berat"])));
      fd.append("fasilitas_ids", JSON.stringify(fasilitasIds));
      fd.append("logistik_ids", JSON.stringify(logistikIds));
      fotos.forEach(f => fd.append("fotos[]", f));

      await api.post("/laporan", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Form-Access-Token": formToken,
        },
      });

      sessionStorage.removeItem('sipena_form_access_token');
      setShowSuccess(true);
    } catch (err: any) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.error ?? err.message;

      if (status === 401) {
        sessionStorage.removeItem('sipena_form_access_token');
        alert('Sesi akses form tidak valid atau sudah kedaluwarsa. Silakan masukkan password kembali.');
        window.location.reload();
        return;
      }

      alert("❌ Gagal mengirim laporan: " + errMsg);
      console.error("Submit error:", err.response?.data ?? err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    sessionStorage.removeItem('sipena_form_access_token');
    resetForm();
    navigate("/");
  };

  return (
    <div className="space-y-6">
      {/* Success Modal */}
      {showSuccess && <SuccessModal onClose={handleSuccessClose} />}

      {/* Submitting Modal */}
      {isSubmitting && <SubmittingModal />}

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold mb-3">
          <span className="material-symbols-outlined text-sm">report_problem</span> LANGKAH 4: KERUSAKAN &amp; DOKUMENTASI
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Detail Kerusakan Bencana</h1>
        <p className="text-slate-500 text-sm mt-1">Mohon lengkapi data tingkat kerusakan rumah, fasilitas publik, dan kebutuhan logistik mendesak.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Rumah */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
          <div className="h-1.5 bg-amber-500 w-full" />
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6">
              <span className="material-symbols-outlined text-amber-600">home_work</span>
              <h2 className="text-lg font-bold text-slate-800">Kerusakan Rumah</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[["rumah_rusak_ringan","RUSAK RINGAN"],["rumah_rusak_sedang","RUSAK SEDANG"],["rumah_rusak_berat","RUSAK BERAT"]].map(([name, label]) => (
                <div key={name} className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-mono focus:ring-2 focus:ring-amber-400 outline-none text-base font-bold"
                    value={kerusakan[name] !== undefined && kerusakan[name] !== null && kerusakan[name] !== "" ? kerusakan[name] : "0"}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      const slicedVal = val.slice(0, 9);
                      const cleanVal = slicedVal === "" ? "0" : slicedVal.replace(/^0+(?=\d)/, '');
                      setKerusakan({ [name]: cleanVal });
                    }}
                    onKeyDown={(e) => { if (["e","E","+","-",".",","].includes(e.key)) e.preventDefault(); }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fasilitas Umum */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex flex-col mb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600">account_balance</span>
              <h2 className="text-lg font-bold text-slate-800">Fasilitas Umum Terdampak</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Bisa pilih lebih dari satu</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FASILITAS_UMUM.map(f => (
              <label key={f.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer group transition-all ${fasilitasIds.includes(f.id) ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="checkbox" className="w-5 h-5 rounded text-amber-500"
                  checked={fasilitasIds.includes(f.id)} onChange={() => toggle(fasilitasIds, setFasilitasIds, f.id)} />
                <span className="text-sm text-slate-700">{f.label}</span>
              </label>
            ))}
          </div>
          {fasilitasIds.includes(9) && (
            <div className="mt-3 animate-fade-in">
              <input type="text" placeholder="Sebutkan fasilitas umum lainnya..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                value={kerusakan.catatan_fasilitas_umum ?? ""}
                onChange={e => setKerusakan({ ...kerusakan, catatan_fasilitas_umum: e.target.value })}
              />
            </div>
          )}
        </section>

        {/* Logistik */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex flex-col mb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600">inventory_2</span>
              <h2 className="text-lg font-bold text-slate-800">Kebutuhan Logistik Mendesak</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">Bisa pilih lebih dari satu</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LOGISTIK.map(f => (
              <label key={f.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer group transition-all ${logistikIds.includes(f.id) ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="checkbox" className="w-5 h-5 rounded text-amber-500"
                  checked={logistikIds.includes(f.id)} onChange={() => toggle(logistikIds, setLogistikIds, f.id)} />
                <span className="text-sm text-slate-700">{f.label}</span>
              </label>
            ))}
          </div>
          {logistikIds.includes(8) && (
            <div className="mt-3 animate-fade-in">
              <input type="text" placeholder="Sebutkan logistik mendesak lainnya..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                value={kerusakan.catatan_lain ?? ""}
                onChange={e => setKerusakan({ ...kerusakan, catatan_lain: e.target.value })}
              />
            </div>
          )}
        </section>

        {/* Upload Foto & Video */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600">photo_camera</span>
              <h2 className="text-lg font-bold text-slate-800">Dokumentasi Media *</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">MAKS. 5 FILE</span>
          </div>

          <label className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-amber-600">cloud_upload</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700">Klik untuk unggah atau seret file</p>
              <p className="text-sm text-slate-500 mt-1">
                Unggah maksimal 5 file bukti dalam bentuk foto atau video. Setiap file maksimal 100 MB. Format yang didukung: JPG, JPEG, PNG, MP4, MOV, atau 3GP.
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

          {fotoPreviews.length > 0 && (
            <div className="grid grid-cols-5 gap-3 mt-4">
              {fotoPreviews.map((url, i) => {
                const isVideo = fotos[i]?.type.startsWith("video/");
                return (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                    {isVideo ? (
                      <video src={url} controls className="w-full h-full object-cover animate-fade-in" />
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover animate-fade-in" />
                    )}
                    <button type="button" onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 5 - fotoPreviews.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400">add</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom Nav */}
        <div className="mt-8 flex justify-between items-center p-2 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={prevStep}
            disabled={isSubmitting}
            className="flex items-center gap-1 sm:gap-2 text-slate-500 px-2.5 sm:px-5 py-2 sm:py-2.5 hover:bg-slate-100 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-[10px] sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm sm:text-base">arrow_back</span>
            <span>Kembali</span>
          </button>
          <div className="text-slate-400 font-bold uppercase text-[10px] sm:text-sm whitespace-nowrap"><span className="hidden xs:inline">Langkah </span>4/4</div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1 sm:gap-2 bg-amber-500 text-white rounded-xl px-3.5 sm:px-6 py-2 sm:py-3 active:scale-95 transition-transform shadow-md disabled:opacity-50 text-[10px] sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap"
          >
            <span>{isSubmitting ? "Menyimpan..." : "Submit Laporan"}</span>
            <span className="material-symbols-outlined text-sm sm:text-base">
              {isSubmitting ? "hourglass_top" : "send"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
