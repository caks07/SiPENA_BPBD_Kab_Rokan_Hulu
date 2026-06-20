import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import SipenaNav from "../components/SipenaNav";
import NewsTicker from "../components/NewsTicker";

/* ── Warna marker ditentukan oleh STATUS SIAGA ─────────────────── */
const STATUS_COLOR: Record<string, string> = {
  siaga1: "#DC2626",
  siaga2: "#EA580C",
  siaga3: "#CA8A04",
  selesai: "#10B981",
};
const STATUS_LABEL: Record<string, string> = {
  siaga1: "Siaga 1",
  siaga2: "Siaga 2",
  siaga3: "Siaga 3",
  selesai: "Selesai",
};

/* ── Simbol marker ditentukan oleh JENIS BENCANA ────────────────── */
const JENIS_ICON: Record<string, string> = {
  banjir: "water_drop",
  banjir_bandang: "waves",
  tanah_longsor: "landscape",
  cuaca_ekstrim: "air",
  kekeringan: "wb_sunny",
  karhutla: "local_fire_department",
  wabah: "coronavirus",
  gempa_bumi: "activity_zone",
  konflik_sosial: "groups",
};

/* ── Buat divIcon: warna = siaga, ikon = jenis ─────────────────── */
function createDisasterIcon(jenis: string, status: string, isNew: boolean) {
  const color = STATUS_COLOR[status] ?? "#CA8A04";
  const icon = JENIS_ICON[jenis] ?? "warning";
  const badge = isNew
    ? `<div style="position:absolute;top:-4px;right:-4px;background:#FACC15;color:#1C1600;
        font-size:7px;font-weight:900;padding:1px 4px;border-radius:99px;
        border:2px solid white;line-height:1.4;z-index:2">BARU</div>`
    : "";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="width:40px;height:40px;background:${color};border-radius:50%;
          border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;position:relative;z-index:1;">
          <span class="material-symbols-outlined"
            style="color:white;font-size:18px;font-variation-settings:'FILL' 1;">${icon}</span>
        </div>
        <div style="position:absolute;width:40px;height:40px;background:${color};
          border-radius:50%;opacity:0.35;
          animation:markerPulse 1.8s ease-out infinite;z-index:0;"></div>
        ${badge}
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
}

export default function DashboardMapPage() {
  const navigate = useNavigate();
  const [filterBencana, setFilterBencana] = useState<string[]>(["semua"]);
  const [filterStatus, setFilterStatus] = useState<string[]>(["semua"]);

  const toggleBencana = (j: string) => {
    setFilterBencana((prev) => {
      if (j === "semua") return ["semua"];
      const next = prev.filter((item) => item !== "semua");
      if (next.includes(j)) {
        const updated = next.filter((item) => item !== j);
        return updated.length === 0 ? ["semua"] : updated;
      } else {
        return [...next, j];
      }
    });
  };

  const toggleStatus = (s: string) => {
    setFilterStatus((prev) => {
      if (s === "semua") return ["semua"];
      const next = prev.filter((item) => item !== "semua");
      if (next.includes(s)) {
        const updated = next.filter((item) => item !== s);
        return updated.length === 0 ? ["semua"] : updated;
      } else {
        return [...next, s];
      }
    });
  };

  const resetFilters = () => {
    setFilterBencana(["semua"]);
    setFilterStatus(["semua"]);
  };
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [geojsonData, setGeojsonData] = useState<any>(null);

  /* ── GeoJSON: Langsung dari MapRohul.geojson (file lokal) ── */
  useEffect(() => {
    fetch("/MapRohul.geojson")
      .then((r) => r.json())
      .then((d) => setGeojsonData(d))
      .catch((e) => console.warn("GeoJSON load error:", e));
  }, []);

  /* ── Ambil data dari API ── */
  const { data: laporanRaw = [], isLoading } = useQuery({
    queryKey: ["dashboard-map"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/map");
      return Array.isArray(data) ? data : (data?.data ?? []);
    },
  });

  const laporan = (laporanRaw as any[])
    .map((item) => ({
      ...item,
      latitude: parseFloat(item.latitude),
      longitude: parseFloat(item.longitude),
      jenis_bencana: item.jenis_bencana ?? "tidak_diketahui",
      status: item.status ?? "siaga3",
    }))
    .filter((i) => !isNaN(i.latitude) && !isNaN(i.longitude) && i.latitude !== 0);

  const filtered = laporan.filter((i) => {
    if (filterBencana.length > 0 && !filterBencana.includes("semua")) {
      if (!filterBencana.includes(i.jenis_bencana)) return false;
    }
    if (filterStatus.length > 0 && !filterStatus.includes("semua")) {
      if (!filterStatus.includes(i.status)) return false;
    } else {
      if (i.status === "selesai") return false;
    }
    return true;
  });

  const uniqueJenis = [...new Set(laporan.map((i) => i.jenis_bencana))];

  const [activeLayer, setActiveLayer] = useState<"osm" | "satellite">("satellite");

  /* ── GeoJSON style (berubah sesuai layer aktif) ── */
  const geoJsonStyle = useCallback(() => ({
    fillColor: activeLayer === "satellite" ? "#FACC15" : "#3B82F6",
    fillOpacity: 0.08,
    color: activeLayer === "satellite" ? "#FACC15" : "#1E40AF",
    weight: 2.5,
    opacity: 0.85,
    dashArray: "4 3",
  }), [activeLayer]);

  const onEachFeature = useCallback((feature: any, layer: L.Layer) => {
    // MapRohul.geojson pakai NAMOBJ, API pakai nama_kecamatan
    const name = feature.properties?.NAMOBJ ?? feature.properties?.nama_kecamatan ?? "";
    if (name) layer.bindTooltip(name, { permanent: false, direction: "center", className: "kec-tooltip" });
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden", position: "relative", fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes markerPulse {
          0%   { transform: scale(1);   opacity: 0.35; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes tickerScroll {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .kec-tooltip {
          background: rgba(15,23,42,0.88) !important;
          color: #fff !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 6px !important;
          font-family: Inter, sans-serif !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }
        .kec-tooltip::before { display: none !important; }
        .leaflet-popup-content-wrapper {
          padding: 0 !important; border-radius: 12px !important;
          overflow: hidden !important; box-shadow: 0 8px 32px rgba(0,0,0,0.22) !important;
        }
        .leaflet-popup-content { margin: 0 !important; width: 230px !important; }
        .leaflet-popup-tip-container { display: none; }
      `}</style>

      {/* ── FIXED HEADER: SipenaNav + NewsTicker ── */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <SipenaNav />
      </div>
      <NewsTicker />

      {/* ── MAP (full screen, header offset via padding) ── */}
      <div style={{ position: "absolute", inset: 0, paddingTop: 96 }}>
        <MapContainer
          center={[0.95, 100.35]}
          zoom={9}
          minZoom={5}
          maxZoom={activeLayer === "satellite" ? 17 : 19}
          maxBounds={[[6.0, 95.0], [-6.0, 109.0]]}
          zoomControl={false}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            key={`base-${activeLayer}`}
            attribution={activeLayer === "osm"
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              : "Tiles &copy; Esri"}
            url={activeLayer === "osm"
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"}
            maxZoom={activeLayer === "satellite" ? 17 : 19}
          />
          {activeLayer === "satellite" && (
            <TileLayer key="labels-satellite" url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution="" pane="shadowPane" />
          )}


          {/* Batas kecamatan dari GeoJSON */}
          {geojsonData && (
            <GeoJSON
              key={`geojson-${activeLayer}`}
              data={geojsonData}
              style={geoJsonStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {/* Marker laporan */}
          {filtered.map((item) => {
            const THREE_DAYS_MS = 259_200_000;
            const isNew = item.created_at && Date.now() - new Date(item.created_at).getTime() < THREE_DAYS_MS;
            const jenis = item.jenis_bencana ?? "tidak_diketahui";
            const markerColor = STATUS_COLOR[item.status] ?? "#CA8A04";

            return (
              <Marker
                key={item.id}
                position={[item.latitude, item.longitude]}
                icon={createDisasterIcon(jenis, item.status, !!isNew)}
              >
                <Popup>
                  <div style={{ fontFamily: "Inter, sans-serif", minWidth: 230 }}>
                    {/* Header */}
                    <div style={{ background: markerColor, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ color: "white", fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                          {JENIS_ICON[jenis] ?? "warning"}
                        </span>
                        <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
                          {jenis.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                      {isNew && (
                        <span style={{ background: "#FACC15", color: "#1C1600", fontSize: 8, fontWeight: 900, padding: "2px 6px", borderRadius: 99 }}>
                          BARU
                        </span>
                      )}
                    </div>
                    {/* Body */}
                    <div style={{ padding: "10px 14px 12px", background: "white" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#94A3B8" }}>location_on</span>
                        <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>{item.nama_kecamatan ?? "-"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#94A3B8" }}>schedule</span>
                        <span style={{ fontSize: 11, color: "#64748B" }}>
                          {item.waktu_kejadian
                            ? new Date(item.waktu_kejadian).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
                            : "-"}
                        </span>
                      </div>
                      {/* Status badge */}
                      <div style={{ marginBottom: 8 }}>
                        <span style={{
                          background: markerColor + "22", color: markerColor, fontSize: 10,
                          fontWeight: 700, padding: "2px 10px", borderRadius: 99,
                          textTransform: "uppercase", border: `1px solid ${markerColor}44`,
                        }}>
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                      </div>
                      {/* Korban */}
                      {(item.korban_meninggal > 0 || item.korban_luka_berat > 0) && (
                        <div style={{
                          background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6,
                          padding: "5px 8px", fontSize: 11, color: "#DC2626", fontWeight: 600, marginBottom: 8
                        }}>
                          {item.korban_meninggal > 0 && `⚠ Meninggal: ${item.korban_meninggal}`}
                          {item.korban_luka_berat > 0 && ` · Luka Berat: ${item.korban_luka_berat}`}
                        </div>
                      )}
                      <button
                        onClick={() => navigate(`/detail/${item.id}`)}
                        style={{
                          width: "100%", padding: "8px 0", background: markerColor, color: "white",
                          border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer"
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.filter = "brightness(1.12)")}
                        onMouseOut={(e) => (e.currentTarget.style.filter = "brightness(1)")}
                      >
                        Lihat Detail →
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* ── MOBILE BOTTOM BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-5 py-4 z-[800]">
        <div className="flex gap-4">
          {(["siaga1", "siaga2", "siaga3", "selesai"] as const).map((s) => {
            const count = laporan.filter((i) => i.status === s).length;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLOR[s] }} />
                <span className="text-white text-sm font-bold">{count}</span>
              </div>
            );
          })}
        </div>
        <button onClick={() => setShowMobileMenu(true)} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-md">
          <span className="material-symbols-outlined text-[16px]">tune</span>
          Filter
        </button>
      </div>

      {/* ── PANEL FILTER ── */}
      {showMobileMenu && <div className="md:hidden fixed inset-0 z-[1100] bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />}
      <aside className={`fixed z-[3000] bg-slate-900/95 backdrop-blur-xl md:rounded-2xl md:border border-white/10 shadow-2xl transition-transform duration-300
        ${showMobileMenu ? "translate-y-0" : "translate-y-full md:translate-y-0"}
        bottom-0 left-0 right-0 p-6 md:p-4 rounded-t-3xl md:top-28 md:bottom-4 md:left-4 md:right-auto md:w-60 flex flex-col gap-6 md:gap-3 max-h-[70vh] md:max-h-none overflow-y-auto`}>
        
        <div className="flex md:hidden justify-between items-center border-b border-white/10 pb-3 mb-2">
           <h3 className="text-white font-bold text-base">Filter &amp; Ringkasan</h3>
           <button onClick={() => setShowMobileMenu(false)} className="text-slate-400 hover:text-white p-2 focus:outline-none">
             <span className="material-symbols-outlined text-2xl">close</span>
           </button>
        </div>

        {/* Filter Jenis */}
        <div className="flex-shrink-0 w-full">
          <p style={{ color: "#64748B", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
            Filter Jenis
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {["semua", ...uniqueJenis].map((j) => {
              const active = filterBencana.includes(j);
              return (
                <button key={j} onClick={() => toggleBencana(j)} style={{
                  textAlign: "left", background: active ? "#F39200" : "transparent",
                  color: active ? "white" : "rgba(148,163,184,0.9)",
                  border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 11,
                  fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                  textTransform: "capitalize",
                }}>
                  {j !== "semua" && (
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: active ? "white" : "rgba(148,163,184,0.7)", fontVariationSettings: "'FILL' 1" }}>
                      {JENIS_ICON[j] ?? "warning"}
                    </span>
                  )}
                  {j === "semua" ? "Semua Jenis" : j.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Status Siaga */}
        <div className="flex-shrink-0 w-full">
          <p style={{ color: "#64748B", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
            Filter Status Siaga
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(["semua", "siaga1", "siaga2", "siaga3", "selesai"] as const).map((s) => {
              // Label khusus untuk filter
              const active = filterStatus.includes(s);
              const col = STATUS_COLOR[s];
              return (
                <button key={s} onClick={() => toggleStatus(s)} style={{
                  textAlign: "left", background: active ? (col ?? "#F39200") : "transparent",
                  color: active ? "white" : "rgba(148,163,184,0.9)",
                  border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 11,
                  fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                }}>
                  {s !== "semua" && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                  )}
                  {s === "semua" ? "Semua (Siaga Aktif)" : STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reset Filter Button */}
        <button
          onClick={resetFilters}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-white/5"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          Reset Filter
        </button>

        {/* Ringkasan */}
        <div className="flex-shrink-0 w-full" style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
          <p style={{ color: "#64748B", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
            Ringkasan
          </p>
          {(["siaga1", "siaga2", "siaga3", "selesai"] as const).map((s) => {
            const count = laporan.filter((i) => i.status === s).length;
            return (
              <div key={s} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[s] }} />
                  <span style={{ color: "rgba(148,163,184,0.8)", fontSize: 11 }}>{STATUS_LABEL[s]}</span>
                </div>
                <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>{count}</span>
              </div>
            );
          })}
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <span style={{ color: "#F39200", fontSize: 20, fontWeight: 800 }}>{filtered.length}</span>
            <span style={{ color: "#64748B", fontSize: 10, marginLeft: 4 }}>ditampilkan</span>
          </div>
        </div>

        {/* Mobile Apply Button */}
        <button
          onClick={() => setShowMobileMenu(false)}
          className="md:hidden w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">done</span>
          Terapkan &amp; Selesai
        </button>
      </aside>

      {/* ── LEGENDA KANAN BAWAH ── */}
      <div className="hidden md:block fixed right-4 bottom-8 z-[900] bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-4 min-w-[180px]">
        <p style={{ color: "#64748B", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Status Siaga
        </p>
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c, flexShrink: 0 }} />
            <span style={{ color: "rgba(148,163,184,0.85)", fontSize: 11 }}>{STATUS_LABEL[s]}</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 8, paddingTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 2.5, background: activeLayer === "satellite" ? "#FACC15" : "#1E40AF", borderRadius: 1 }} />
          <span style={{ color: "rgba(148,163,184,0.85)", fontSize: 11 }}>Batas Kecamatan</span>
        </div>
      </div>

      {/* ── LAYER SWITCHER (kanan atas) ── */}
      <div className="fixed right-4 top-24 md:top-28 z-[900] bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden flex shadow-lg">
        {(["osm", "satellite"] as const).map((layer) => (
          <button key={layer} onClick={() => setActiveLayer(layer)} style={{
            padding: "8px 14px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
            background: activeLayer === layer ? "#F39200" : "transparent",
            color: activeLayer === layer ? "white" : "rgba(148,163,184,0.8)",
            letterSpacing: "0.05em", textTransform: "uppercase",
          }}>
            {layer === "osm" ? "🗺 Peta" : "🛰 Satelit"}
          </button>
        ))}
      </div>
    </div>
  );
}
