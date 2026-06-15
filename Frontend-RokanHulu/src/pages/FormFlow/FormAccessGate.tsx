import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { verifyFormAccess } from "../../api/formAccess";

/**
 * FormAccessGate
 *
 * Muncul sebelum FormFlow di /lapor.
 * Hanya meminta satu field: password akses form (bukan login akun).
 * Ini adalah password bersama yang dikelola admin di halaman Administrator.
 *
 * Setelah berhasil:
 *  - access_token disimpan ke sessionStorage key 'sipena_form_access_token'
 *  - onSuccess() dipanggil → FormFlow ditampilkan
 *
 * Setelah submit laporan berhasil (di Step4):
 *  - sessionStorage dihapus → user harus masukkan password lagi
 */
interface Props {
  onSuccess: () => void;
  backTo?: string;
}

export default function FormAccessGate({ onSuccess, backTo = "/" }: Props) {
  const navigate = useNavigate();

  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [cooldown, setCooldown]   = useState(false);
  const cooldownRef               = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading || cooldown) return;
    setError("");
    setLoading(true);

    try {
      const token = await verifyFormAccess(password);
      sessionStorage.setItem("sipena_form_access_token", token);
      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Terjadi kesalahan. Coba lagi.";
      setError(msg);
      setPassword("");
      // Cooldown 3 detik setelah gagal (UI throttle)
      setCooldown(true);
      cooldownRef.current = setTimeout(() => setCooldown(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        backgroundImage: "url('/bg_landingpage.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        padding: "16px",
      }}
    >
      {/* Blurred & dim overlay mimicking landing page background backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 1,
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "linear-gradient(145deg, rgba(28,31,43,0.98), rgba(15,23,42,0.98))",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          padding: "32px 28px 28px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Logo + Title */}
        <div style={{ textAlign: "center", marginBottom: 28, marginTop: 4 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg, #F39200, #FACC15)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(243,146,0,0.4)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "white", fontSize: 28, fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
          </div>
          <h1 style={{ color: "white", fontSize: 20, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.3px" }}>
            Akses Form Laporan
          </h1>
          <p style={{ color: "rgba(148,163,184,0.8)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            Masukkan password akses untuk melanjutkan ke formulir pelaporan bencana.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Password field */}
          <div>
            <label
              htmlFor="form-access-password"
              style={{ display: "block", color: "rgba(148,163,184,0.9)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}
            >
              Password Akses Form
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="form-access-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                placeholder="Masukkan password..."
                autoComplete="current-password"
                autoFocus
                required
                style={{
                  width: "100%",
                  padding: "13px 48px 13px 16px",
                  background: "rgba(255,255,255,0.07)",
                  border: error ? "1.5px solid #EF4444" : "1.5px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { if (!error) e.target.style.borderColor = "#F39200"; }}
                onBlur={(e) => { if (!error) e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "rgba(148,163,184,0.7)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
                tabIndex={-1}
                aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {showPass ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 12px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span className="material-symbols-outlined" style={{ color: "#F87171", fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                  error
                </span>
                <span style={{ color: "#FCA5A5", fontSize: 13 }}>{error}</span>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            id="form-access-submit"
            type="submit"
            disabled={loading || cooldown || !password.trim()}
            style={{
              width: "100%",
              padding: "14px",
              background:
                loading || cooldown || !password.trim()
                  ? "rgba(243,146,0,0.4)"
                  : "linear-gradient(135deg, #F39200, #FACC15)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || cooldown || !password.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    border: "2.5px solid rgba(255,255,255,0.4)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Memverifikasi...
              </>
            ) : cooldown ? (
              "Coba lagi dalam 3 detik..."
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
                  lock_open
                </span>
                Buka Form
              </>
            )}
          </button>

          {/* Kembali ke Beranda button below Buka Form */}
          <button
            type="button"
            onClick={() => navigate(backTo)}
            style={{
              width: "100%",
              padding: "13px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(226,232,240,0.9)",
              borderRadius: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 700,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              arrow_back
            </span>
            Kembali ke Beranda
          </button>
        </form>

        {/* Footer note */}
        <p style={{ color: "rgba(100,116,139,0.7)", fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
          Formulir ini diperuntukkan bagi petugas TRC BPBD Kab. Rokan Hulu.
          <br />
          Hubungi admin kabupaten jika lupa password.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
