import { useNavigate } from "react-router-dom";
import { useFormStore } from "../state/useFormStore";

const DISASTER_CARDS = [
  { id: "banjir", label: "Banjir", icon: "tsunami", desc: "Laporkan kejadian luapan air sungai atau genangan tinggi di wilayah Anda.", color: "#43658B" },
  { id: "banjir_bandang", label: "Banjir Bandang", icon: "flood", desc: "Laporan cepat aliran air deras pegunungan yang membawa material lumpur.", color: "#3B426E" },
  { id: "tanah_longsor", label: "Tanah Longsor", icon: "landslide", desc: "Kejadian pergerakan tanah atau tebing yang membahayakan pemukiman/jalan.", color: "#8D624E" },
  { id: "cuaca_ekstrim", label: "Cuaca Ekstrim", icon: "cyclone", desc: "Angin kencang, puting beliung, atau hujan badai yang merusak infrastruktur.", color: "#4E5B6E" },
  { id: "kekeringan", label: "Kekeringan", icon: "wb_sunny", desc: "Laporan krisis air bersih atau kekeringan lahan pertanian di wilayah Anda.", color: "#B08933" },
  { id: "karhutla", label: "Kebakaran Hutan", icon: "local_fire_department", desc: "Laporan titik api (hotspot) atau kejadian kebakaran lahan dan hutan.", color: "#A64444" },
  { id: "wabah", label: "Epidemi Wabah", icon: "coronavirus", desc: "Laporan penyebaran penyakit menular atau wabah kesehatan masyarakat.", color: "#6E5B8E" },
  { id: "gempa_bumi", label: "Gempa Bumi", icon: "volcano", desc: "Informasi getaran gempa bumi dan laporan kerusakan struktur bangunan.", color: "#BC6C25" },
  { id: "konflik_sosial", label: "Konflik Sosial", icon: "groups", desc: "Laporan gangguan keamanan atau konflik sosial antar kelompok masyarakat.", color: "#2C3E50" },
];

function OfficialFigure({
  src,
  name,
  role,
}: {
  src: string;
  name: string;
  role: string;
}) {
  return (
    <div className="relative w-[155px] xl:w-[165px] 2xl:w-[190px] h-[265px] xl:h-[280px] 2xl:h-[310px] flex items-end justify-center overflow-hidden bg-transparent">
      <img
        src={src}
        alt={name}
        className="h-[255px] xl:h-[270px] 2xl:h-[300px] w-auto max-w-none object-contain object-bottom drop-shadow-lg"
      />

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent pt-12 pb-4 px-2 text-center">
        <p className="text-sm xl:text-base font-bold text-white leading-tight truncate">
          {name}
        </p>
        <p className="text-xs xl:text-sm text-amber-400 font-bold leading-tight truncate mt-1">
          {role}
        </p>
      </div>
    </div>
  );
}

function OfficialFigureCompact({
  src,
  name,
  role,
}: {
  src: string;
  name: string;
  role: string;
}) {
  return (
    <div className="relative w-[70px] sm:w-[105px] md:w-[130px] lg:w-[150px] flex flex-col items-center">
      <img
        src={src}
        alt={name}
        className="h-[88px] sm:h-[123px] md:h-[158px] lg:h-[193px] w-auto object-contain object-bottom drop-shadow-lg"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pt-12 pb-2 px-1 text-center">
        <p className="text-[7px] sm:text-[9px] md:text-[10px] lg:text-[11px] font-bold text-white leading-tight truncate">
          {name}
        </p>
        <p className="text-[6px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-amber-400 font-semibold mt-0.5 truncate">
          {role}
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { setJenisBencana, resetForm } = useFormStore();

  const handleSelect = (jenis: string) => {
    resetForm();
    setJenisBencana(jenis);
    navigate("/lapor");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#F4F5F7" }}>
      {/* Navbar */}
      <nav style={{ background: "rgba(28,31,43,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
        className="flex justify-between items-center px-6 h-20 w-full fixed top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <img src="/logo_sipena.png" alt="Logo SIPENA" className="h-12 w-auto" />
          <span className="text-2xl font-black text-white tracking-tighter">SiPENA</span>
        </div>
        <button onClick={() => navigate("/login")}
          className="px-6 py-2 rounded-lg font-bold text-white transition-all active:scale-95"
          style={{ background: "#F39200" }}>
          Login
        </button>
      </nav>

      {/* Hero */}
      <section className="relative flex items-center justify-center overflow-hidden h-[440px] sm:h-[500px] md:h-[560px] xl:h-[512px] mt-20">
        <div className="absolute inset-0" style={{
          backgroundImage: "url('/bg_landingpage.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(28,31,43,0.6), rgba(28,31,43,0.9))" }} />

        {/* Emblems */}
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8 w-12 sm:w-16 md:w-20 lg:w-28 z-20">
          <img
            src="/emblem_rohul.png"
            alt="Emblem Rohul"
            className="w-full h-auto object-contain drop-shadow-lg"
          />
        </div>

        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 sm:w-16 md:w-20 lg:w-28 z-20">
          <img
            src="/emblem_bpbd.png"
            alt="Emblem BPBD"
            className="w-full h-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Desktop Officials Layout (2 left, 2 right) - xl screens and above */}
        <div className="hidden xl:flex absolute bottom-0 left-0 items-end z-20 gap-0">
          <OfficialFigure src="/emblem_bupati_setengah.png" name="Anton, ST, MM" role="Bupati Rokan Hulu" />
          <OfficialFigure src="/emblem_wakilBupati_setengah.png" name="H. Syafaruddin Poti, SH., MM." role="Wakil Bupati" />
        </div>

        <div className="hidden xl:flex absolute bottom-0 right-0 items-end z-20 gap-0">
          <OfficialFigure src="/emblem_sekretarisDaerah.png" name="H. Drs. Yusmar, M.Si" role="Sekda Rohul" />
          <OfficialFigure src="/emblem_kepalaBPBD.png" name="H. Zulhendri, S.Sos., M.IP" role="Kalaksa BPBD" />
        </div>

        {/* Compact/Mobile/Tablet Officials Layout - below xl screens */}
        <div className="xl:hidden absolute bottom-0 left-2 sm:left-4 flex items-end z-20">
          <OfficialFigureCompact src="/emblem_bupati_setengah.png" name="Anton, ST, MM" role="Bupati Rokan Hulu" />
          <OfficialFigureCompact src="/emblem_wakilBupati_setengah.png" name="H. Syafaruddin Poti, SH., MM." role="Wakil Bupati" />
        </div>

        <div className="xl:hidden absolute bottom-0 right-2 sm:right-4 flex items-end z-20">
          <OfficialFigureCompact src="/emblem_sekretarisDaerah.png" name="H. Drs. Yusmar, M.Si" role="Sekda Rohul" />
          <OfficialFigureCompact src="/emblem_kepalaBPBD.png" name="H. Zulhendri, S.Sos., M.IP" role="Kalaksa BPBD" />
        </div>

        <div className="absolute inset-x-0 top-[112px] sm:top-[130px] md:top-[150px] xl:top-1/2 xl:-translate-y-1/2 z-30 px-4 text-center">
          <div className="max-w-[480px] sm:max-w-[600px] xl:max-w-[580px] 2xl:max-w-[720px] 3xl:max-w-[800px] mx-auto">
            <h1 className="text-[25px] sm:text-[34px] md:text-[40px] xl:text-[38px] 2xl:text-[46px] 3xl:text-[52px] leading-[1.12] font-black text-white uppercase tracking-tight drop-shadow-lg">
              <span className="block">Laporan Cepat Kejadian</span>
              <span className="block">Bencana</span>
              <span className="block">Kabupaten Rokan Hulu</span>
            </h1>
            <p className="text-xs sm:text-lg md:text-xl text-white/80 font-light tracking-wide mt-3">
              Sistem Pelaporan dan Monitoring Bencana Terintegrasi
            </p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-6 py-20 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DISASTER_CARDS.map(card => (
            <div key={card.id}
              className="relative group rounded-2xl shadow-xl overflow-hidden flex flex-col border border-white/10 hover:-translate-y-2 transition-all duration-300"
              style={{ background: card.color }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0) 100%)" }} />
              <div className="p-6 sm:p-10 flex flex-col items-center text-center flex-grow relative z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4 sm:mb-6 border border-white/20">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl">{card.icon}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-2 sm:mb-3 text-white tracking-wide uppercase">{card.label}</h3>
                <p className="text-white/70 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed">{card.desc}</p>
                <button onClick={() => handleSelect(card.id)}
                  className="mt-auto w-full py-3 sm:py-4 bg-white font-bold rounded-xl hover:bg-opacity-90 transition-all uppercase text-[10px] sm:text-xs tracking-widest shadow-lg active:scale-95"
                  style={{ color: card.color }}>
                  Laporkan di sini!
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "#1C1F2B", borderTop: "1px solid rgba(255,255,255,0.1)" }}
        className="px-8 md:px-16 py-16 text-sm text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">

          {/* Brand & Copyright */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo_sipena.png" alt="Logo SIPENA" className="h-12 w-auto" />
              <span className="text-2xl font-black text-white tracking-tighter">SiPENA</span>
            </div>
            <p className="leading-relaxed mb-4 max-w-sm">
              Sistem Informasi Peringatan Dini & Laporan Bencana Terpadu.<br />
              Badan Penanggulangan Bencana Daerah (BPBD) Kabupaten Rokan Hulu.
            </p>
            <p className="text-xs text-slate-500">© 2026 BPBD Kabupaten Rokan Hulu.</p>
          </div>

          {/* Contact & Address */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Hubungi Kami</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5">location_on</span>
                <p className="leading-relaxed">
                  <a href="https://maps.app.goo.gl/7jVfC25HRoJoXKRt9" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">
                    Komplek Perkantoran Pemerintah Daerah (Bina Praja) Kabupaten Rokan Hulu, Desa Pematang Berangan, Kecamatan Rambah, Pasir Pengaraian, Riau. (Klik Disini)
                  </a>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">call</span>
                <div className="flex flex-col">
                  <a href="https://wa.me/628151525464" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">0815-1525-464</a>
                  <a href="https://wa.me/6282171087041" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">0821-7108-7041</a>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media & Blog */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Media Sosial</h4>
            <div className="flex flex-col gap-3">
              <a href="https://www.instagram.com/bpbd_rohul/" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-amber-400 transition-colors w-fit">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                Instagram (@bpbd_rohul)
              </a>
              <a href="https://www.facebook.com/profile.php?id=100079550822116&locale=id_ID" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-amber-400 transition-colors w-fit">
                <span className="material-symbols-outlined text-[18px]">public</span>
                Facebook (Bpbd Rokan Hulu)
              </a>
              <a href="https://www.tiktok.com/@bpbdrohul?is_from_webapp=1&sender_device=pc" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-amber-400 transition-colors w-fit">
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                TikTok (@bpbdrohul)
              </a>
              <a href="https://bpbdrohul-pusdalops.blogspot.com/?fbclid=IwY2xjawRi6gJleHRuA2FlbQIxMABicmlkETFSd20xRjZNbmh6S09kZk53c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHsyCrDkSQrKx-ldO_wLs5IwRwZlXkig0SX0nMA0cPAHI9Hi2-phYoiUWpbBk_aem_i-XUNGA_V1LNXfkmiCoAYQ" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-amber-400 transition-colors w-fit mt-2">
                <span className="material-symbols-outlined text-[18px]">article</span>
                Pusdalops Blog (Klik Disini)
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
