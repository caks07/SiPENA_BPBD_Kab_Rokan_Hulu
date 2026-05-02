/**
 * LeafletMap — Reusable map component
 * Features:
 *  - Layer switcher: OSM ↔ Satelit (Esri) dengan tombol toggle pojok kanan atas
 *  - GeoJSON boundary: tampilkan batas kecamatan dari prop atau fetch /geojson/kecamatan
 *  - Marker: warna berdasarkan severity_level (siaga 1/2/3)
 *  - onPick: mode pick koordinat (klik peta untuk set marker)
 */
import { useState, useCallback } from "react";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, useMapEvents, ZoomControl } from "react-leaflet";
import L from "leaflet";
import type { Laporan } from "../types";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const TILE_LAYERS = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

const SEVERITY_COLOR = (s?: number | null): string =>
  s === 1 ? "#DC2626" : s === 2 ? "#EA580C" : "#CA8A04";

const iconBySeverity = (severity?: number | null) =>
  L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${SEVERITY_COLOR(severity)};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

function Picker({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick?.(e.latlng.lat, e.latlng.lng) });
  return null;
}

type Props = {
  center: [number, number];
  zoom?: number;
  height?: number | string;
  laporan?: Laporan[];
  geojson?: GeoJSON.GeoJsonObject | null;
  onPick?: (lat: number, lng: number) => void;
  picked?: [number, number] | null;
  showLayerControl?: boolean;
  defaultLayer?: "osm" | "satellite";
  zoomControl?: boolean;
};

export default function LeafletMap({
  center, zoom = 10, height = 420, laporan = [], geojson,
  onPick, picked, showLayerControl = true, defaultLayer = "osm", zoomControl = true,
}: Props) {
  const [activeLayer, setActiveLayer] = useState<"osm" | "satellite">(defaultLayer);

  const geoJsonStyle = useCallback(() => ({
    color: activeLayer === "satellite" ? "#FACC15" : "#1E40AF",
    weight: 2,
    opacity: 0.75,
    fillColor: activeLayer === "satellite" ? "#FACC15" : "#3B82F6",
    fillOpacity: 0.06,
    dashArray: "4 3",
  }), [activeLayer]);

  const onEachFeature = useCallback((feature: any, layer: L.Layer) => {
    const name = feature.properties?.NAMOBJ ?? feature.properties?.nama_kecamatan ?? "";
    if (name) {
      layer.bindTooltip(name, {
        permanent: false, direction: "center", className: "leaflet-kec-tooltip"
      });
    }
  }, []);

  const validGeojson = geojson && (geojson as any).features
    ? {
        ...(geojson as any),
        features: ((geojson as any).features as any[]).filter((f) => f.geometry !== null),
      }
    : geojson;

  return (
    <div style={{ position: "relative", height, width: "100%" }}>
      <style>{`
        .leaflet-kec-tooltip {
          background: rgba(15,23,42,0.88) !important; color: #fff !important;
          border: 1px solid rgba(255,255,255,0.15) !important; border-radius: 6px !important;
          font-family: Inter, sans-serif !important; font-size: 11px !important; font-weight: 600 !important;
        }
        .leaflet-kec-tooltip::before { display: none !important; }
        .leaflet-popup-content-wrapper { border-radius: 10px !important; padding: 0 !important; overflow: hidden !important; }
        .leaflet-popup-content { margin: 0 !important; }
      `}</style>

      <MapContainer
        center={center} zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          key={activeLayer}
          url={TILE_LAYERS[activeLayer].url}
          attribution={TILE_LAYERS[activeLayer].attribution}
          maxZoom={19}
        />

        {/* Label jalan di atas satelit */}
        {activeLayer === "satellite" && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            attribution="" pane="shadowPane"
          />
        )}

        {/* Batas kecamatan */}
        {validGeojson && (
          <GeoJSON
            key={`geojson-${activeLayer}`}
            data={validGeojson as any}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Marker laporan */}
        {laporan.map((l) => (
          <Marker key={l.id} position={[l.latitude, l.longitude]} icon={iconBySeverity(l.severity_level)}>
            <Popup>
              <div style={{ padding: "10px 14px", fontFamily: "Inter, sans-serif", minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: SEVERITY_COLOR(l.severity_level), marginBottom: 4 }}>
                  {(l.jenis_bencana ?? "—").replace(/_/g, " ").toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: "#64748B" }}>{l.lokasi_text ?? "-"}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{l.status}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Picked marker */}
        {picked && <Marker position={picked} />}

        {/* Click picker */}
        {onPick && <Picker onPick={onPick} />}

        {/* Zoom control */}
        {zoomControl && <ZoomControl position="bottomright" />}
      </MapContainer>

      {/* Layer switcher button */}
      {showLayerControl && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 1000,
          background: "white", borderRadius: 8, overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)", border: "1px solid #e2e8f0",
          display: "flex",
        }}>
          {(["osm", "satellite"] as const).map((layer) => (
            <button key={layer} onClick={() => setActiveLayer(layer)}
              style={{
                padding: "6px 12px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                background: activeLayer === layer ? "#F39200" : "white",
                color: activeLayer === layer ? "white" : "#64748B",
                letterSpacing: "0.05em", textTransform: "uppercase",
                transition: "all 0.2s",
              }}>
              {layer === "osm" ? "Peta" : "Satelit"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
