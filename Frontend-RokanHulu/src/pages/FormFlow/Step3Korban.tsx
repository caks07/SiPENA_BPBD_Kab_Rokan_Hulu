import { useFormStore } from "../../state/useFormStore";

const KORBAN_FIELDS = [
  { name: "korban_luka_ringan", label: "Luka Ringan", unit: "JIWA", section: "luka" },
  { name: "korban_luka_berat", label: "Luka Berat", unit: "JIWA", section: "luka" },
  { name: "korban_meninggal", label: "Meninggal Dunia", unit: "JIWA", section: "fatal", danger: true },
  { name: "korban_hilang", label: "Hilang", unit: "JIWA", section: "fatal" },
  { name: "kk_mengungsi", label: "Rumah Tangga (KK) Terdampak", unit: "KK", section: "pengungsi" },
  { name: "jiwa_mengungsi", label: "Individu (Jiwa) Mengungsi", unit: "JIWA", section: "pengungsi" },
];

export default function Step3Korban() {
  const { korban, setKorban, nextStep, prevStep } = useFormStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const renderInput = (f: typeof KORBAN_FIELDS[0]) => (
    <div key={f.name} className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">{f.label}</label>
      <div className="relative">
        <input required type="number" min="0"
          className={`w-full border-2 rounded-xl py-3 px-4 text-xl font-bold focus:ring-2 outline-none transition-all ${
            f.danger ? "bg-red-50 border-red-200 focus:ring-red-400 text-red-700" : "bg-slate-50 border-slate-200 focus:ring-amber-400"
          }`}
          value={korban[f.name] ?? 0}
          onChange={e => setKorban({ [f.name]: Number(e.target.value) })}
          onKeyDown={(e) => { if (["e","E","+","-",".",","].includes(e.key)) e.preventDefault(); }}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{f.unit}</span>
      </div>
    </div>
  );

  return (
    // pb-28 agar konten terakhir tidak tertutup footer fixed
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg p-6 md:p-8 pb-28">
      <div className="flex items-center gap-3 mb-2">
        <span className="bg-amber-500 text-white p-2 rounded-lg">
          <span className="material-symbols-outlined">group</span>
        </span>
        <h1 className="text-2xl font-bold text-slate-800">Data Korban Jiwa</h1>
      </div>
      <p className="text-sm text-slate-500 mb-8">Langkah 3: Masukkan rincian data korban jiwa, luka-luka, dan pengungsian akibat kejadian bencana.</p>

      <form onSubmit={handleSubmit}>
        {/* Korban Luka */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">medical_services</span> Korban Luka & Cedera
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {KORBAN_FIELDS.filter(f => f.section === "luka").map(renderInput)}
          </div>
        </section>

        <hr className="border-slate-200 my-6" />

        {/* Korban Fatal */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500">warning_amber</span> Korban Fatal & Hilang
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {KORBAN_FIELDS.filter(f => f.section === "fatal").map(renderInput)}
          </div>
        </section>

        <hr className="border-slate-200 my-6" />

        {/* Pengungsi */}
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">house</span> Data Pengungsian
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {KORBAN_FIELDS.filter(f => f.section === "pengungsi").map(renderInput)}
          </div>
        </section>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg flex gap-3 mb-6">
          <span className="material-symbols-outlined text-amber-600">info</span>
          <p className="text-sm text-amber-800">Pastikan data yang diinput sesuai dengan laporan validasi dari tim lapangan di Kecamatan.</p>
        </div>

        {/* Bottom Nav */}
        <div className="mt-8 flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <button type="button" onClick={prevStep} className="flex items-center gap-2 text-slate-500 px-6 py-3 hover:bg-slate-100 rounded-xl transition-all active:scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-bold uppercase tracking-wider">Kembali</span>
          </button>
          <div className="text-slate-400 font-bold uppercase text-sm">Langkah 3/4</div>
          <button type="submit" className="flex items-center gap-2 bg-amber-500 text-white rounded-xl px-6 py-3 active:scale-95 transition-transform shadow-md">
            <span className="text-sm font-bold uppercase tracking-wider">Lanjut</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
