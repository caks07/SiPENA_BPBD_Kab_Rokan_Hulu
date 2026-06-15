/**
 * NewsTicker — Running news bar (fixed di bawah SipenaNav)
 * Isi: [Kecamatan] Jenis Bencana · Tanggal Jam · Status Siaga
 * Dipakai di semua halaman yang punya SipenaNav.
 */
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

const SIAGA_LABEL: Record<string, string> = {
  siaga1: "SIAGA 1", siaga2: "SIAGA 2", siaga3: "SIAGA 3", selesai: "SELESAI",
};

function formatTickerItem(item: any): string {
  const kec    = (item.nama_kecamatan ?? "—").toUpperCase();
  const jenis  = (item.jenis_bencana ?? "").replace(/_/g, " ").toUpperCase();
  const status = SIAGA_LABEL[item.status] ?? (item.status ?? "").toUpperCase();
  const waktu  = item.waktu_kejadian
    ? new Date(item.waktu_kejadian).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "-";
  return `[ ${kec} ]  ${jenis}  ·  ${waktu}  ·  ${status}`;
}

export default function NewsTicker() {
  const { data: laporanRaw = [] } = useQuery({
    queryKey: ["news-ticker"],
    queryFn: async () => {
      const { data } = await api.get("/laporan");
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
    staleTime: 2 * 60 * 1000,
  });

  const activeLaporan = (laporanRaw as any[]).filter((item: any) => item.status !== "selesai");
  const items = activeLaporan.slice(0, 10);
  const displayItems = items.length > 0
    ? items.map(formatTickerItem)
    : [
        "SISTEM AKTIF",
        "MEMANTAU WILAYAH KABUPATEN ROKAN HULU",
        "SIPENA BPBD ROKAN HULU"
      ];

  // Repeat items to ensure smooth scrolling
  const repeatedItems = [...displayItems, ...displayItems, ...displayItems, ...displayItems];

  const duration = Math.max(90, displayItems.length * 18);

  return (
    <>
      <style>{`
        @keyframes tickerMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .sipena-ticker-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: tickerMove ${duration}s linear infinite;
        }

        .sipena-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 70,
          left: 0,
          right: 0,
          height: 40,
          background: "#F39200",
          zIndex: 999,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="sipena-ticker-track">
          {repeatedItems.map((text, idx) => (
            <div
              key={`${text}-${idx}`}
              className="flex items-center shrink-0 text-white text-[13px] font-bold tracking-[0.06em] leading-none"
              style={{ transform: "translateY(1.5px)" }}
            >
              <span className="whitespace-nowrap px-0">{text}</span>
              <span className="mx-10 text-white/70 select-none">||</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

