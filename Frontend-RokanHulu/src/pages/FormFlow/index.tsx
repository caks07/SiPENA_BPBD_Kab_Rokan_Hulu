import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormStore } from "../../state/useFormStore";
import Step1Identitas from "./Step1Identitas";
import Step2DetailBencana from "./Step2DetailBencana";
import Step3Korban from "./Step3Korban";
import Step4KerusakanFoto from "./Step4KerusakanFoto";
import FormAccessGate from "./FormAccessGate";

const STEPS = ["Identitas & Lokasi", "Detail Bencana", "Data Korban", "Kerusakan & Foto"];

const JENIS_LABEL: Record<string, string> = {
  banjir: "Banjir",
  banjir_bandang: "Banjir Bandang",
  tanah_longsor: "Tanah Longsor",
  cuaca_ekstrim: "Cuaca Ekstrim",
  kekeringan: "Kekeringan",
  karhutla: "Kebakaran Hutan",
  wabah: "Epidemi Wabah",
  gempa_bumi: "Gempa Bumi",
  konflik_sosial: "Konflik Sosial",
};

export default function FormFlow() {
  const navigate = useNavigate();
  const { step, jenis_bencana, resetForm } = useFormStore();

  // Cek apakah sudah memiliki form access token di sessionStorage
  const [accessGranted, setAccessGranted] = useState<boolean>(
    () => !!sessionStorage.getItem("sipena_form_access_token")
  );

  useEffect(() => {
    if (!jenis_bencana) navigate("/");
  }, [jenis_bencana, navigate]);

  if (!jenis_bencana) return null;

  // Tampilkan password gate jika belum diverifikasi
  if (!accessGranted) {
    return <FormAccessGate onSuccess={() => setAccessGranted(true)} />;
  }

  const handleCancel = () => {
    // Hapus token saat user batal (keluar dari form)
    sessionStorage.removeItem("sipena_form_access_token");
    resetForm();
    navigate("/");
  };

  return (
    <div
      className="min-h-screen pb-32"
      style={{
        fontFamily: "Inter, sans-serif",
        background: "#f9f9f9",
        backgroundImage: "radial-gradient(circle at 2px 2px, #e2e2e2 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* TopNav */}
      <nav
        style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        className="fixed top-0 w-full z-50 shadow-xl flex justify-between items-center px-4 sm:px-6 py-3"
      >
        <div className="text-base sm:text-xl font-black text-white tracking-widest uppercase truncate">
          SIPENA BPBD Rokan Hulu
        </div>
        <div className="hidden md:flex gap-8 items-center text-sm font-semibold">
          <span className="text-amber-500 border-b-2 border-amber-500 pb-1">Laporan</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 hover:text-white transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-base">close</span>
            <span className="hidden sm:inline">Batal</span>
          </button>
        </div>
      </nav>

      <main className="pt-24 px-4 max-w-4xl mx-auto space-y-6">
        {/* Step Badge */}
        <div className="mb-6 p-3 sm:p-4 rounded-lg border border-slate-200 flex items-center gap-3 bg-white/80">
          <span className="material-symbols-outlined text-amber-600 flex-shrink-0">info</span>
          <p className="text-sm text-slate-600 italic">
            Langkah {step} dari 4: {STEPS[step - 1]} — <strong>{JENIS_LABEL[jenis_bencana]}</strong>
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((_label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div
                className={`h-1 w-full rounded-full ${step > i ? "bg-amber-500" : "bg-slate-200"}`}
                style={step === i + 1 ? { boxShadow: "0 0 8px rgba(243,146,0,0.5)" } : undefined}
              />
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && <Step1Identitas />}
        {step === 2 && <Step2DetailBencana />}
        {step === 3 && <Step3Korban />}
        {step === 4 && <Step4KerusakanFoto />}
      </main>
    </div>
  );
}
