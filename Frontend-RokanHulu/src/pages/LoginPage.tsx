import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(username, password);
      // Redirect ke dashboard setelah login berhasil
      navigate("/dashboard");
    } catch {
      setError("Login gagal, cek username dan kata sandi Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col w-full relative">
      <main className="flex-grow flex items-center justify-center p-[24px] relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <span className="material-symbols-outlined text-[500px]" style={{ fontVariationSettings: "'wght' 100" }}>public</span>
        </div>

        {/* Login Container */}
        <div className="w-full max-w-[1100px] grid md:grid-cols-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-outline-variant overflow-hidden z-10 relative">
          
          {/* Branding/Visual Side */}
          <div className="hidden md:flex flex-col justify-between p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img src="/bg_halaman_login.jpeg" alt="Background" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 z-10"></div>
            </div>

            <div className="z-10 relative">
              <div className="flex items-center gap-5 mb-12">
                <img src="/logo_sipena.png" alt="Logo SiPENA" className="h-20 w-auto" />
                <div>
                  <h1 className="font-display-lg text-[36px] font-bold tracking-tight leading-none m-0 text-white">SiPENA</h1>
                  <p className="font-label-caps text-[14px] font-bold text-slate-400 m-0 mt-1">Geospatial Intelligence System</p>
                </div>
              </div>
              <h2 className="font-headline-md text-[24px] font-semibold mt-[32px] max-w-xs leading-snug m-0 text-white">Pusat Kendali Operasi Penanggulangan Bencana</h2>
              <p className="font-body-md text-[16px] mt-2 text-slate-300">Kabupaten Rokan Hulu</p>
            </div>
            
            <div className="mt-auto z-10 relative">
              <div className="flex items-center gap-2 mb-4 bg-white/5 p-4 rounded-xl backdrop-blur-md border border-white/10">
                <span className="material-symbols-outlined text-accent">verified_user</span>
                <span className="font-body-sm text-[14px]">Akses Terenkripsi & Terotorisasi</span>
              </div>
              <p className="font-body-sm text-[14px] text-slate-300">
                  Sistem Manajemen Penanggulangan Bencana Terintegrasi. Pastikan Anda menggunakan kredensial resmi.
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-white relative z-10">
            <div className="mb-10 text-center md:text-left">
              <div className="md:hidden flex items-center justify-center gap-3 mb-4">
                <img src="/logo_sipena.png" alt="Logo SiPENA" className="h-16 w-auto" />
                <span className="font-display-lg text-[28px] font-bold text-primary">SiPENA</span>
              </div>
              <h3 className="font-headline-md text-[24px] font-semibold text-on-surface m-0">Selamat Datang</h3>
              <p className="font-body-md text-[16px] text-on-surface-variant m-0 mt-1">Silakan masuk untuk mengakses Command Center.</p>
            </div>

            <form className="space-y-6" onSubmit={submit}>
              
              {/* Role Indicator Tabs (Visual only based on reference) */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
                <div className="flex-1 font-label-caps text-[11px] py-2.5 rounded-lg bg-white text-primary shadow-sm border border-slate-200 text-center font-bold">AKSES PETUGAS</div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-2 text-left">
                <label className="font-label-caps text-[11px] font-bold text-slate-500 flex items-center gap-2 px-1">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  NAMA PENGGUNA
                </label>
                <input 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none font-body-md text-[16px] text-on-surface" 
                  placeholder="Masukkan username" 
                  type="text"
                  required
                />
              </div>

              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center px-1">
                  <label className="font-label-caps text-[11px] font-bold text-slate-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    KATA SANDI
                  </label>
                </div>
                <div className="relative">
                  <input 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none font-body-md text-[16px] text-on-surface" 
                    placeholder="••••••••" 
                    type="password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-1 text-left">
                <input className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent accent-accent" id="remember" type="checkbox"/>
                <label className="font-body-sm text-[14px] text-slate-600 cursor-pointer" htmlFor="remember">Ingat saya di perangkat ini</label>
              </div>

              <button 
                disabled={isLoading}
                className="w-full h-14 bg-accent text-white rounded-xl font-headline-md text-[18px] font-semibold flex items-center justify-center gap-2 hover:bg-[#d98200] active:scale-[0.98] transition-all shadow-lg shadow-accent/20 mt-4 disabled:opacity-70" 
                type="submit"
              >
                <span>{isLoading ? "Memproses..." : "Masuk ke Dashboard"}</span>
                {!isLoading && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
              <p className="font-label-caps text-[10px] font-bold text-slate-400 tracking-widest m-0">SISTEM TERINTEGRASI</p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 bg-accent text-white hover:bg-transparent hover:text-slate-600 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 border border-transparent hover:border-slate-300"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                KEMBALI KE BERANDA
              </button>
            </div>
          </div>
        </div>

        {/* System Status Footer Overlay */}
        <div className="absolute bottom-6 left-0 right-0 px-[24px] flex flex-col md:flex-row justify-between items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-200 shadow-sm pointer-events-auto">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-label-caps text-[10px] font-bold text-slate-600">SYSTEM READY: STABLE</span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-200 shadow-sm pointer-events-auto">
            <span className="font-label-caps text-[10px] font-bold text-slate-500">GIS V 2.4.0 — © 2024 BPBD ROKAN HULU</span>
          </div>
        </div>
      </main>
    </div>
  );
}
