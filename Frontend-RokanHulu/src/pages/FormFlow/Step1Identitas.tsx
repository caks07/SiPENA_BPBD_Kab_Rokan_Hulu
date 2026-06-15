import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, GeoJSON } from "react-leaflet";
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

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
};

const TimeInput = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
  const [showPicker, setShowPicker] = useState(false);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const getInitialTime = () => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      return { hour: parseInt(h) || 0, minute: parseInt(m) || 0 };
    }
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  };

  const [time, setTime] = useState(getInitialTime);

  useEffect(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      const hourVal = parseInt(h) || 0;
      const minVal = parseInt(m) || 0;
      setTime({ hour: hourVal, minute: minVal });
    }
  }, [value]);

  const selectHour = (h: number) => {
    setTime(prev => {
      const updated = { ...prev, hour: h };
      onChange(`${String(updated.hour).padStart(2, "0")}:${String(updated.minute).padStart(2, "0")}`);
      return updated;
    });
    if (hourRef.current) {
      hourRef.current.scrollTo({ top: h * 36, behavior: "smooth" });
    }
  };

  const selectMinute = (m: number) => {
    setTime(prev => {
      const updated = { ...prev, minute: m };
      onChange(`${String(updated.hour).padStart(2, "0")}:${String(updated.minute).padStart(2, "0")}`);
      return updated;
    });
    if (minuteRef.current) {
      minuteRef.current.scrollTo({ top: m * 36, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (showPicker) {
      setTimeout(() => {
        if (hourRef.current) hourRef.current.scrollTop = time.hour * 36;
        if (minuteRef.current) minuteRef.current.scrollTop = time.minute * 36;
      }, 50);
    }
  }, [showPicker]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, isHour: boolean) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / 36);
    if (isHour) {
      if (index >= 0 && index < 24 && index !== time.hour) {
        setTime(prev => {
          const updated = { ...prev, hour: index };
          onChange(`${String(updated.hour).padStart(2, "0")}:${String(updated.minute).padStart(2, "0")}`);
          return updated;
        });
      }
    } else {
      if (index >= 0 && index < 60 && index !== time.minute) {
        setTime(prev => {
          const updated = { ...prev, minute: index };
          onChange(`${String(updated.hour).padStart(2, "0")}:${String(updated.minute).padStart(2, "0")}`);
          return updated;
        });
      }
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const formatted = `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-mono font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-100 transition-all"
      >
        <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
        {formatted}
      </button>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-[1999] bg-black/20" onClick={() => setShowPicker(false)} />
          <div className="absolute right-0 bottom-full mb-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[2000] w-64 text-white">
            <div className="text-center font-bold text-xs uppercase tracking-widest text-slate-400 mb-2">Pilih Waktu</div>
            
            {/* Wheel container */}
            <div className="relative h-[144px] bg-slate-950 rounded-xl overflow-hidden flex justify-center border border-slate-800">
              {/* Active highlight overlay */}
              <div className="absolute left-0 right-0 top-[54px] h-[36px] bg-slate-800/50 border-y border-slate-700 pointer-events-none z-10" />

              {/* Hours Column */}
              <div
                ref={hourRef}
                onScroll={(e) => handleScroll(e, true)}
                className="w-16 h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-[54px] z-20 text-center"
                style={{ scrollbarWidth: "none" }}
              >
                {hours.map((h) => (
                  <div
                    key={`h-${h}`}
                    onClick={() => selectHour(h)}
                    className={`h-[36px] snap-center flex items-center justify-center font-mono font-bold text-lg cursor-pointer transition-colors ${
                      time.hour === h ? "text-amber-400 font-extrabold text-xl scale-110" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {String(h).padStart(2, "0")}
                  </div>
                ))}
              </div>

              <div className="h-full flex items-center justify-center font-bold text-slate-400 px-2 z-10">:</div>

              {/* Minutes Column */}
              <div
                ref={minuteRef}
                onScroll={(e) => handleScroll(e, false)}
                className="w-16 h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-[54px] z-20 text-center"
                style={{ scrollbarWidth: "none" }}
              >
                {minutes.map((m) => (
                  <div
                    key={`m-${m}`}
                    onClick={() => selectMinute(m)}
                    className={`h-[36px] snap-center flex items-center justify-center font-mono font-bold text-lg cursor-pointer transition-colors ${
                      time.minute === m ? "text-amber-400 font-extrabold text-xl scale-110" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {String(m).padStart(2, "0")}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  selectHour(now.getHours());
                  selectMinute(now.getMinutes());
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-300 transition-colors"
              >
                Sekarang
              </button>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-xs font-bold rounded-lg text-slate-950 transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

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

  // Geolocation state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

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

  const cleanName = (n: string) => n.toLowerCase().replace(/[^a-z]/g, "");

  const findKecamatanForPoint = (pos: [number, number]) => {
    if (!geojson || !geojson.features) return null;
    try {
      const pt = point([pos[1], pos[0]]); // GeoJSON uses [lng, lat]
      for (const feature of geojson.features) {
        if (booleanPointInPolygon(pt, feature)) {
          return feature.properties?.NAMOBJ ?? feature.properties?.nama_kecamatan ?? null;
        }
      }
    } catch (e) {
      console.warn("Polygon check failed", e);
    }
    return null;
  };

  const checkKecamatanMatch = (pos: [number, number], currentKecId: string) => {
    if (!geojson) return { match: true };

    const geoKecName = findKecamatanForPoint(pos);
    if (!geoKecName) {
      return { match: false, errorType: "outside", message: "Koordinat berada di luar jangkauan wilayah Rokan Hulu." };
    }

    if (!currentKecId) {
      const foundKec = kecamatans.find(k => cleanName(k.nama_kecamatan) === cleanName(geoKecName));
      return { match: true, autoSelectKec: foundKec };
    }

    const selectedKec = kecamatans.find(k => String(k.id) === currentKecId);
    if (!selectedKec) return { match: true };

    const match = cleanName(geoKecName) === cleanName(selectedKec.nama_kecamatan);
    if (!match) {
      const foundKec = kecamatans.find(k => cleanName(k.nama_kecamatan) === cleanName(geoKecName));
      const targetName = foundKec ? foundKec.nama_kecamatan : geoKecName;
      return {
        match: false,
        errorType: "mismatch",
        targetKecamatan: foundKec,
        message: `Lokasi berada di kecamatan ${targetName}. Silakan ganti kecamatan di atas menjadi kecamatan ${targetName}.`
      };
    }

    return { match: true };
  };

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
      const pt = point([pos[1], pos[0]]);
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
    const checkRes = checkKecamatanMatch(pos, laporan.kecamatan_id || "");
    if (!checkRes.match) {
      alert(checkRes.message);
      return;
    }
    if (checkRes.autoSelectKec) {
      setLaporan({ kecamatan_id: String(checkRes.autoSelectKec.id) });
    }
    setPosition(pos);
    setLatInput(pos[0].toFixed(6));
    setLngInput(pos[1].toFixed(6));
  };

  const handleManualCoord = (lat: string, lng: string) => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      const checkRes = checkKecamatanMatch([parsedLat, parsedLng], laporan.kecamatan_id || "");
      if (!checkRes.match) {
        alert(checkRes.message);
        return;
      }
      if (checkRes.autoSelectKec) {
        setLaporan({ kecamatan_id: String(checkRes.autoSelectKec.id) });
      }
      setPosition([parsedLat, parsedLng]);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Browser tidak mendukung fitur lokasi saat ini.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);
    setLocationSuccess(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (!checkInPolygon([lat, lng])) {
          setLocationError("Gagal mengambil lokasi saat ini karena di luar jangkauan. Silakan pilih melalui maps di bawah.");
          setIsGettingLocation(false);
          return;
        }

        const checkRes = checkKecamatanMatch([lat, lng], laporan.kecamatan_id || "");
        if (!checkRes.match) {
          if (checkRes.errorType === "mismatch") {
            setLocationError(checkRes.message);
          } else {
            setLocationError("Gagal mengambil lokasi saat ini karena di luar jangkauan. Silakan pilih melalui maps di bawah.");
          }
          setIsGettingLocation(false);
          return;
        }

        if (checkRes.autoSelectKec) {
          setLaporan({ kecamatan_id: String(checkRes.autoSelectKec.id) });
        }

        setLatInput(lat.toFixed(6));
        setLngInput(lng.toFixed(6));
        setPosition([lat, lng]);
        setIsGettingLocation(false);
        setLocationSuccess("Lokasi saat ini berhasil digunakan.");
      },
      (err) => {
        let message = "Gagal mengambil lokasi saat ini.";
        if (err.code === err.PERMISSION_DENIED) {
          message = "Izin lokasi ditolak. Harap izinkan akses lokasi pada pengaturan browser Anda (klik ikon gembok di sebelah URL) lalu coba kembali, atau gunakan pin lokasi pada peta di bawah.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = "Lokasi saat ini tidak tersedia.";
        } else if (err.code === err.TIMEOUT) {
          message = "Waktu pengambilan lokasi habis. Silakan coba lagi.";
        }
        setLocationError(message);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) return alert("Klik pada peta atau isi koordinat manual untuk menentukan titik lokasi kejadian!");
    
    if (laporan.waktu_kejadian) {
      const [datePart, timePart] = laporan.waktu_kejadian.split("T");
      const today = getLocalDateString();
      
      if (datePart > today) {
        return alert("Tanggal kejadian tidak boleh di masa depan.");
      }
      
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
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg p-5 md:p-8 pb-28 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <span className="bg-amber-500 text-white p-2 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined">person_pin_circle</span>
        </span>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Identitas &amp; Lokasi Kejadian</h1>
      </div>
      <p className="text-xs md:text-sm text-slate-500 mb-6">Langkah 1: Isi identitas pelapor dan tentukan lokasi kejadian.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Nama Pelapor */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Nama Pelapor *</label>
          <input
            required
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-sm md:text-base"
            value={laporan.nama_pelapor || ""}
            onChange={(e) => setLaporan({ nama_pelapor: e.target.value })}
            placeholder="Nama lengkap pelapor"
          />
        </div>

        {/* 2. Tanggal & Waktu Kejadian */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Tanggal &amp; Waktu Kejadian *</label>
          <div className="flex gap-2">
            <input
              required
              type="date"
              max={getLocalDateString()}
              className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 outline-none transition-all text-sm"
              value={laporan.waktu_kejadian ? laporan.waktu_kejadian.split("T")[0] : ""}
              onChange={(e) => {
                const selectedVal = e.target.value;
                const maxVal = getLocalDateString();
                if (selectedVal > maxVal) {
                  alert("Tanggal kejadian tidak boleh di masa depan!");
                  return;
                }
                const timePart = laporan.waktu_kejadian ? (laporan.waktu_kejadian.split("T")[1] || "00:00") : "00:00";
                if (selectedVal === maxVal) {
                  const now = new Date();
                  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
                  if (timePart.slice(0, 5) > currentTime) {
                    alert("Waktu kejadian melebihi waktu saat ini! Waktu disesuaikan ke jam sekarang.");
                    setLaporan({ waktu_kejadian: `${selectedVal}T${currentTime}` });
                    return;
                  }
                }
                setLaporan({ waktu_kejadian: `${selectedVal}T${timePart.slice(0,5)}` });
              }}
            />
            <TimeInput
              value={laporan.waktu_kejadian ? (laporan.waktu_kejadian.split("T")[1]?.slice(0, 5) || "") : ""}
              onChange={(val) => {
                const datePart = (laporan.waktu_kejadian && laporan.waktu_kejadian.includes("T")) 
                  ? laporan.waktu_kejadian.split("T")[0] 
                  : getLocalDateString();
                const today = getLocalDateString();
                if (datePart === today) {
                  const now = new Date();
                  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
                  if (val > currentTime) {
                    alert("Waktu kejadian tidak boleh melebihi waktu saat ini!");
                    return;
                  }
                }
                setLaporan({ waktu_kejadian: `${datePart}T${val}` });
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Pilih tanggal dan gunakan jam scroll-wheel di sebelah kanan.</p>
        </div>

        {/* 3. Kecamatan */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Kecamatan *</label>
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
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 outline-none transition-all text-sm"
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

        {/* 4. Lokasi Saat Ini (GPS) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Gunakan Posisi GPS Saat Ini</label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
              isGettingLocation
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 active:scale-95"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isGettingLocation ? "sync" : "my_location"}
            </span>
            {isGettingLocation ? "Mengambil lokasi..." : "Gunakan Lokasi Saat Ini"}
          </button>

          {locationSuccess && (
            <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              {locationSuccess}
            </div>
          )}
          {locationError && (
            <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 leading-relaxed">
              <span className="material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0">error</span>
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {/* 5. Maps Pin Lokasi di Peta */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Pin Lokasi di Peta *</label>
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
          <div className="rounded-xl overflow-hidden border-2 border-slate-300 shadow-md h-72 md:h-96">
            <MapContainer center={position ?? [0.78, 100.42]} zoom={9} minZoom={5} maxZoom={activeLayer === "satellite" ? 17 : 19} maxBounds={[[6.0, 95.0], [-6.0, 109.0]]} className="w-full h-full">
              <TileLayer
                key={`base-${activeLayer}`}
                url={activeLayer === "satellite"
                  ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                attribution={activeLayer === "satellite" ? "Tiles © Esri" : "© OpenStreetMap"}
                maxZoom={activeLayer === "satellite" ? 17 : 19}
              />
              {activeLayer === "satellite" && (
                <TileLayer key="labels-satellite" url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution="" pane="shadowPane" />
              )}
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
              <FlyToPosition position={position} />
              <ClickMarker position={position} onMapClick={handleMapClick} />
            </MapContainer>
          </div>
          <p className="text-[10px] text-slate-400">
            Pilih kecamatan terlebih dahulu untuk memfokuskan wilayah, kemudian geser atau klik langsung pada peta untuk pin lokasi tepat.
          </p>
        </div>

        {/* 6. Detail Alamat / Lokasi Kejadian */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Detail Alamat / Lokasi Kejadian *</label>
          <textarea
            required
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-400 outline-none transition-all resize-none h-24 text-sm"
            value={laporan.lokasi_text || ""}
            onChange={(e) => setLaporan({ lokasi_text: e.target.value })}
            placeholder="Cth: Jalan Sudirman, Dusun Maju RT 01/RW 02..."
          />
        </div>

        {/* 7. Koordinat Display Box */}
        {position && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs md:text-sm text-amber-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] flex-shrink-0">location_on</span>
            <span>Koordinat Terpilih: <strong>{position[0].toFixed(6)}, {position[1].toFixed(6)}</strong></span>
          </div>
        )}

        {/* 8. Koordinat Manual (Opsional) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Koordinat Manual (Opsional)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Latitude</label>
              <input type="number" step="0.000001" placeholder="Cth: 0.5965"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                value={latInput}
                onChange={(e) => { setLatInput(e.target.value); handleManualCoord(e.target.value, lngInput); }}
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Longitude</label>
              <input type="number" step="0.000001" placeholder="Cth: 100.6173"
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                value={lngInput}
                onChange={(e) => { setLngInput(e.target.value); handleManualCoord(latInput, e.target.value); }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Gunakan format desimal. Koordinat akan diperiksa kesesuaiannya dengan polygon kecamatan.</p>
        </div>

        {/* Bottom Nav */}
        <div className="mt-8 flex justify-between items-center p-2.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm gap-1.5 sm:gap-2">
          <div className="text-slate-400 font-bold uppercase text-[10px] sm:text-sm whitespace-nowrap">Langkah 1/4</div>
          <button
            type="submit"
            className="flex items-center gap-1 sm:gap-2 bg-amber-500 text-white rounded-xl px-3.5 sm:px-6 py-2 sm:py-3 active:scale-95 transition-transform shadow-md text-[10px] sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap"
          >
            <span>Lanjut</span>
            <span className="material-symbols-outlined text-sm sm:text-base">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
