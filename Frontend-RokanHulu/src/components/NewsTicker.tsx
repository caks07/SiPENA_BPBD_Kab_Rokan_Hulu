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

  const items = (laporanRaw as any[]).slice(0, 10);
  const tickerText = items.length > 0
    ? items.map(formatTickerItem).join("          ·          ")
    : "SISTEM AKTIF  ·  MEMANTAU WILAYAH KABUPATEN ROKAN HULU  ·  SIPENA";

  return (
    <>
      <style>{`
        @keyframes tickerMove {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .sipena-ticker-inner {
          animation: tickerMove ${Math.max(30, items.length * 8)}s linear infinite;
          white-space: nowrap;
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          height: 32,
          background: "#F39200",
          zIndex: 999,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="sipena-ticker-inner"
          style={{ color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
          {tickerText}
        </div>
      </div>
    </>
  );
}
