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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
    setShowCancelConfirm(true);
  };

  const executeCancel = () => {
    setShowCancelConfirm(false);
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
        style={{ background: "rgba(28,31,43,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        className="flex justify-between items-center px-6 h-20 w-full fixed top-0 z-50 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <img src="/logo_sipena.png" alt="Logo SIPENA" className="h-12 w-auto" />
          <span className="text-2xl font-black text-white tracking-tighter">SiPENA</span>
        </div>
        <div className="hidden md:flex gap-8 items-center text-sm font-semibold">
          <span className="text-amber-500 border-b-2 border-amber-500 pb-1">Laporan Kejadian</span>
        </div>
        <div>
          <button
            onClick={handleCancel}
            className="px-6 py-2 rounded-lg font-bold text-white transition-all active:scale-95 bg-red-600 hover:bg-red-700 shadow-md"
          >
            Batalkan
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

      {/* Modal Konfirmasi Batal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-500" />
            <div className="p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-6 border border-amber-100">
                <span className="material-symbols-outlined text-amber-600 text-3xl">warning</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Batalkan Laporan?</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Anda yakin ingin membatalkan laporan ini? Semua data yang telah Anda isi pada formulir ini akan dihapus secara permanen.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-slate-600 text-sm transition-colors"
                >
                  Lanjutkan
                </button>
                <button
                  type="button"
                  onClick={executeCancel}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
                >
                  Ya, Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
