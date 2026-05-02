import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";

const SIAGA_OPTIONS = [
  { value: "siaga1", label: "Siaga 1 — Bahaya", color: "#DC2626", bg: "bg-red-500 text-white border-red-500" },
  { value: "siaga2", label: "Siaga 2 — Siaga",  color: "#EA580C", bg: "bg-orange-500 text-white border-orange-500" },
  { value: "siaga3", label: "Siaga 3 — Waspada",color: "#CA8A04", bg: "bg-yellow-400 text-slate-900 border-yellow-400" },
  { value: "selesai",label: "Selesai",           color: "#10B981", bg: "bg-green-500 text-white border-green-500" },
] as const;

export default function EditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("siaga3");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);

  const { data: laporan, isLoading } = useQuery({
    queryKey: ["laporan", id],
    queryFn: async () => { const { data } = await api.get(`/laporan/${id}`); return data; },
  });

  useEffect(() => {
    if (laporan) {
      setStatus(laporan.status ?? "siaga3");
      setCatatan(laporan.catatan_update ?? "");
    }
  }, [laporan]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const levelMap: Record<string, number> = { siaga1: 1, siaga2: 2, siaga3: 3, selesai: 0 };
      await api.put(`/laporan/${id}`, {
        status,
        severity_level: levelMap[status] ?? 3,
        catatan_update: catatan,
      });
      setSaved(true);
      setTimeout(() => navigate(`/detail/${id}`), 1200);
    } catch {
      alert("Gagal memperbarui laporan. Coba lagi.");
    } finally { setLoading(false); }
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
      <main className="mt-16 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button onClick={() => navigate("/dashboard")} className="hover:text-amber-600">Dashboard</button>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <button onClick={() => navigate(`/detail/${id}`)} className="hover:text-amber-600">Detail #{id}</button>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-slate-800 font-semibold">Update Status</span>
          </div>

          {/* Info Laporan */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-600 text-2xl">crisis_alert</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Laporan #{id}</span>
                <h2 className="text-lg font-bold text-slate-800">{jenisLabel}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  📍 {laporan?.lokasi_text ?? "-"} · {laporan?.nama_kecamatan ?? "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {/* Status Siaga */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                Status Siaga
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SIAGA_OPTIONS.map((opt) => (
                  <label key={opt.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${status === opt.value ? `${opt.bg} border-transparent shadow-md` : "border-slate-200 hover:bg-slate-50"}`}>
                    <input type="radio" name="status" value={opt.value}
                      checked={status === opt.value}
                      onChange={(e) => setStatus(e.target.value)}
                      className="sr-only" />
                    <span className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                      style={{
                        borderColor: status === opt.value ? "white" : opt.color,
                        background: status === opt.value ? "white" : "transparent",
                      }}>
                      {status === opt.value && <span className="w-2 h-2 rounded-full" style={{ background: opt.color }} />}
                    </span>
                    <span className="text-sm font-bold">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Catatan */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Catatan Update (Opsional)
              </label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-amber-400 outline-none resize-none h-24"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tambahkan keterangan perubahan status..." />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button type="button" onClick={() => navigate(`/detail/${id}`)}
                className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 text-sm">
                Batal
              </button>
              <button type="submit" disabled={loading || saved}
                className={`flex-1 px-5 py-3 rounded-xl font-bold text-white text-sm shadow-lg active:scale-95 flex items-center justify-center gap-2
                  ${saved ? "bg-green-500" : "bg-[#F39200] hover:brightness-110"}`}>
                {saved ? (<><span className="material-symbols-outlined text-[20px]">check_circle</span> Tersimpan!</>)
                  : loading ? (<><div className="animate-spin w-4 h-4 rounded-full border-2 border-white border-t-transparent" /> Menyimpan...</>)
                  : (<><span className="material-symbols-outlined text-[20px]">save</span> Simpan Perubahan</>)}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
