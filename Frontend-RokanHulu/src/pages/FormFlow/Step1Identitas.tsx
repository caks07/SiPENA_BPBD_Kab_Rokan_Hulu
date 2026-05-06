import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useFormStore } from "../../state/useFormStore";
import api from "../../api/client";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const TimeInput = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Hanya izinkan angka dan titik dua
    val = val.replace(/[^0-9:]/g, '');

    // Maksimal 1 titik dua
    const colons = val.match(/:/g);
    if (colons && colons.length > 1) return;

    // Auto-insert colon setelah 2 digit
    const nativeEvent = e.nativeEvent as InputEvent;
    if (val.length === 2 && !val.includes(':') && nativeEvent.inputType !== 'deleteContentBackward') {
      val += ':';
    }

    // Auto-format 4 digit ke HH:mm (misal 0830 -> 08:30)
    if (val.length === 4 && !val.includes(':')) {
      val = val.slice(0, 2) + ':' + val.slice(2);
    }

    if (val.length > 5) return;

    setInternalValue(val);
    
    if (val.length === 5 && val.includes(':')) {
      const [h, m] = val.split(':');
      if (parseInt(h) <= 23 && parseInt(m) <= 59) {
        onChange(val);
      }
    } else if (val === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    let val = internalValue;
    if (!val) return;
    
    // Auto pad jika belum lengkap (misal "8:3" -> "08:03", "12" -> "12:00")
    if (!val.includes(':')) {
      if (val.length === 1 || val.length === 2) {
        val = val.padStart(2, '0') + ':00';
      } else if (val.length === 3) {
        val = val.padStart(4, '0');
        val = val.slice(0, 2) + ':' + val.slice(2);
      }
    } else {
      const parts = val.split(':');
      const h = parts[0].padStart(2, '0');
      const m = (parts[1] || '0').padStart(2, '0');
      val = `${h}:${m}`;
    }

    // Validasi HH (00-23) dan mm (00-59)
    const [h, m] = val.split(':');
    if (parseInt(h) > 23 || parseInt(m) > 59) {
      alert("Format waktu tidak valid! Jam (00-23) dan Menit (00-59).");
      setInternalValue('');
      onChange('00:00');
      return;
    }

    setInternalValue(val);
    onChange(val);
  };

  return (
    <input
      type="text"
      required
      placeholder="HH:mm"
      maxLength={5}
      className="w-24 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-3 focus:ring-2 focus:ring-amber-400 outline-none transition-all flex-shrink-0 text-center font-mono text-sm"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};

/**
 * FlyToPosition: setiap kali `position` berubah, flyTo ke sana.
 * Menggunakan useMap() yang harus dipanggil di dalam MapContainer.
 * Ini solusi yang tepat untuk auto-pan saat kecamatan diganti.
 */
function FlyToPosition({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const prevPos = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (position && (
      prevPos.current === null ||
      prevPos.current[0] !== position[0] ||
      prevPos.current[1] !== position[1]
    )) {
      map.flyTo(position, Math.max(map.getZoom(), 12), { animate: true, duration: 0.8 });
      prevPos.current = position;
    }
  }, [position, map]);
  return null;
}

function ClickMarker({
  position,
  onMapClick,
}: {
  position: [number, number] | null;
  onMapClick: (p: [number, number]) => void;
}) {
  useMapEvents({ click(e) { onMapClick([e.latlng.lat, e.latlng.lng]); } });
  return position ? <Marker position={position} /> : null;
}

export default function Step1Identitas() {
  const { laporan, setLaporan, nextStep } = useFormStore();
  const [position, setPosition] = useState<[number, number] | null>(
    laporan.latitude && laporan.longitude ? [laporan.latitude, laporan.longitude] : null
  );
  const [activeLayer, setActiveLayer] = useState<"osm" | "satellite">("satellite");
  const [latInput,  setLatInput]  = useState(laporan.latitude  ? String(laporan.latitude)  : "");
  const [lngInput,  setLngInput]  = useState(laporan.longitude ? String(laporan.longitude) : "");

  const { data: kecamatans = [], isLoading: loadingKec, isError: errorKec } = useQuery({
    queryKey: ["kecamatan-list"],
    queryFn: async () => {
      const { data } = await api.get("/kecamatan");
      return data as { id: number; nama_kecamatan: string; latitude_default: number; longitude_default: number }[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [geojson, setGeojson] = useState<any>(null);
  useEffect(() => {
    fetch("/MapRohul.geojson")
      .then((r) => r.json())
      .then((d) => setGeojson(d))
      .catch((e) => console.warn("GeoJSON load error:", e));
  }, []);

  /**
   * FIX: Sebelumnya ada kondisi `if (kec && !position)` yang mencegah
   * update posisi saat sudah ada marker. Kondisi ini dihapus sehingga
   * setiap kali kecamatan dipilih/diganti, posisi SELALU diupdate ke
   * centroid kecamatan yang dipilih, dan FlyToPosition akan auto-pan.
   */
  const handleKecamatanChange = (id: string) => {
    setLaporan({ kecamatan_id: id });
    const kec = kecamatans.find((k) => String(k.id) === id);
    if (kec) {
      const newPos: [number, number] = [Number(kec.latitude_default), Number(kec.longitude_default)];
      setPosition(newPos);
      setLatInput(String(Number(kec.latitude_default).toFixed(6)));
      setLngInput(String(Number(kec.longitude_default).toFixed(6)));
    }
  };

  const checkInPolygon = (pos: [number, number]) => {
    if (!geojson || !geojson.features) return true;
    try {
      const pt = point([pos[1], pos[0]]); // GeoJSON uses [lng, lat]
      for (const feature of geojson.features) {
        if (booleanPointInPolygon(pt, feature)) {
          return true;
        }
      }
      return false;
    } catch (e) {
      console.warn("Polygon check failed", e);
      return true;
    }
  };

  const handleMapClick = (pos: [number, number]) => {
    if (!checkInPolygon(pos)) {
      alert("Peringatan: Titik koordinat berada di luar jangkauan wilayah polygon!");
      return;
    }
    setPosition(pos);
    setLatInput(pos[0].toFixed(6));
    setLngInput(pos[1].toFixed(6));
  };

  const handleManualCoord = (lat: string, lng: string) => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      if (!checkInPolygon([parsedLat, parsedLng])) {
        alert("Peringatan: Isian tidak sesuai! Koordinat berada di luar polygon wilayah.");
        return;
      }
      setPosition([parsedLat, parsedLng]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) return alert("Klik pada peta atau isi koordinat manual untuk menentukan titik lokasi kejadian!");
    
    if (laporan.waktu_kejadian) {
      const [datePart, timePart] = laporan.waktu_kejadian.split("T");
      const today = new Date().toISOString().slice(0, 10);
      if (datePart === today) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
        if (timePart > currentTime) {
          return alert("Waktu kejadian tidak boleh melebihi waktu saat ini.");
        }
      }
    }

    setLaporan({ latitude: position[0], longitude: position[1] });
    nextStep();
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg p-6 md:p-8 pb-28">
      <div className="flex items-center gap-3 mb-2">
        <span className="bg-amber-500 text-white p-2 rounded-lg">
          <span className="material-symbols-outlined">person_pin_circle</span>
        </span>
        <h1 className="text-2xl font-bold text-slate-800">Identitas &amp; Lokasi Kejadian</h1>
      </div>
      <p className="text-sm text-slate-500 mb-8">Langkah 1: Isi identitas pelapor dan tandai lokasi bencana di peta.</p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Kolom Kiri: Formulir ── */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Pelapor *</label>
              <input
                required
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all"
                value={laporan.nama_pelapor || ""}
                onChange={(e) => setLaporan({ nama_pelapor: e.target.value })}
                placeholder="Nama lengkap pelapor"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tanggal &amp; Waktu Kejadian *</label>
              <div className="flex gap-2">
                <input
                  required
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                  value={laporan.waktu_kejadian ? laporan.waktu_kejadian.split("T")[0] : ""}
                  onChange={(e) => {
                    const timePart = laporan.waktu_kejadian ? (laporan.waktu_kejadian.split("T")[1] || "00:00") : "00:00";
                    setLaporan({ waktu_kejadian: `${e.target.value}T${timePart.slice(0,5)}` });
                  }}
                />
                <TimeInput
                  value={laporan.waktu_kejadian ? (laporan.waktu_kejadian.split("T")[1]?.slice(0, 5) || "") : ""}
                  onChange={(val) => {
                    const datePart = (laporan.waktu_kejadian && laporan.waktu_kejadian.includes("T")) 
                      ? laporan.waktu_kejadian.split("T")[0] 
                      : new Date().toISOString().slice(0, 10);
                    setLaporan({ waktu_kejadian: `${datePart}T${val}` });
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Ketik waktu kejadian (HH:mm) dengan angka</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Kecamatan *</label>
              {loadingKec ? (
                <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-400 text-sm animate-pulse">
                  Memuat data kecamatan...
                </div>
              ) : errorKec ? (
                <div className="w-full bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-red-500 text-sm">
                  Gagal memuat kecamatan. Periksa koneksi server.
                </div>
              ) : (
                <select
                  required
                  id="select-kecamatan"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 outline-none transition-all"
                  value={laporan.kecamatan_id || ""}
                  onChange={(e) => handleKecamatanChange(e.target.value)}
                >
                  <option value="">-- Pilih Kecamatan ({kecamatans.length} tersedia) --</option>
                  {kecamatans.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kecamatan}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detail Alamat / Lokasi Kejadian *</label>
              <textarea
                required
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 outline-none transition-all resize-none h-24"
                value={laporan.lokasi_text || ""}
                onChange={(e) => setLaporan({ lokasi_text: e.target.value })}
                placeholder="Cth: Jalan Sudirman, Dusun Maju RT 01/RW 02..."
              />
            </div>

            {position && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <span className="material-symbols-outlined text-sm align-middle mr-1">location_on</span>
                Koordinat: <strong>{position[0].toFixed(5)}, {position[1].toFixed(5)}</strong>
              </div>
            )}

            {/* Input Manual Koordinat */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Koordinat Manual (Opsional)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Latitude</label>
                  <input type="number" step="0.000001" placeholder="Cth: 1.23456"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                    value={latInput}
                    onChange={(e) => { setLatInput(e.target.value); handleManualCoord(e.target.value, lngInput); }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Longitude</label>
                  <input type="number" step="0.000001" placeholder="Cth: 100.23456"
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                    value={lngInput}
                    onChange={(e) => { setLngInput(e.target.value); handleManualCoord(latInput, e.target.value); }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Isi lat/lng dari Google Maps, atau klik langsung pada peta di atas.</p>
            </div>
          </div>

          {/* ── Kolom Kanan: Peta ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Pin Lokasi di Peta *</label>
              {/* Layer Switcher */}
              <div style={{ display: "flex", overflow: "hidden", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                {(["satellite", "osm"] as const).map((layer) => (
                  <button key={layer} type="button" onClick={() => setActiveLayer(layer)}
                    style={{
                      padding: "4px 10px", fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                      background: activeLayer === layer ? "#F39200" : "white",
                      color: activeLayer === layer ? "white" : "#64748B",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                    {layer === "osm" ? "Peta" : "Satelit"}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border-2 border-slate-300 shadow-md" style={{ height: 340 }}>
              <MapContainer center={position ?? [0.78, 100.42]} zoom={9} minZoom={5} maxBounds={[[6.0, 95.0], [-6.0, 109.0]]} className="w-full h-full">
                <TileLayer
                  key={`base-${activeLayer}`}
                  url={activeLayer === "satellite"
                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                  attribution={activeLayer === "satellite" ? "Tiles © Esri" : "© OpenStreetMap"}
                  maxZoom={19}
                />
                {activeLayer === "satellite" && (
                  <TileLayer key="labels-satellite" url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution="" pane="shadowPane" />
                )}

                {/* Batas kecamatan dari MapRohul.geojson */}
                {geojson && (geojson.features?.length ?? 0) > 0 && (
                  <GeoJSON
                    key={`boundary-${activeLayer}-${geojson.features.length}`}
                    data={geojson as any}
                    style={{
                      color: activeLayer === "satellite" ? "#FACC15" : "#1E40AF",
                      weight: 2.5, opacity: 1,
                      fillColor: activeLayer === "satellite" ? "#FACC15" : "#3B82F6",
                      fillOpacity: 0.07, dashArray: "4 3",
                    }}
                    onEachFeature={(feature, layer) => {
                      const name = feature.properties?.NAMOBJ ?? feature.properties?.nama_kecamatan ?? "";
                      if (name) layer.bindTooltip(name, { permanent: false, direction: "center" });
                    }}
                  />
                )}
                {/* FlyToPosition auto-pan saat kecamatan berubah */}
                <FlyToPosition position={position} />
                <ClickMarker position={position} onMapClick={handleMapClick} />
              </MapContainer>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              Pilih kecamatan terlebih dahulu untuk auto-zoom ke wilayah tersebut lalu klik pada peta untuk pin lokasi tepat.
            </p>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="mt-8 flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-400 font-bold uppercase text-sm">Langkah 1/4</div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-amber-500 text-white rounded-xl px-8 py-3 active:scale-95 transition-transform shadow-md"
          >
            <span className="text-sm font-bold uppercase tracking-wider">Lanjut</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
