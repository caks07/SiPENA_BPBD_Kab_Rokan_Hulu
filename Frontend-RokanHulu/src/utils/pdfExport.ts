import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SIAGA_LABEL: Record<string, string> = {
  siaga1: "Siaga 1", siaga2: "Siaga 2", siaga3: "Siaga 3", selesai: "Selesai",
};

export const FIELD_OPT_KEYS: Record<string, Record<string, string | null>> = {
  banjir: {
    penyebab_ids:"opt_banjir_penyebab", ketinggian_banjir_id:"opt_banjir_ketinggian",
    kondisi_air_id:"opt_banjir_kondisi_air", kondisi_cuaca_id:"opt_kondisi_cuaca",
    luas_genangan: null, penyebab_lain: null, ketinggian_banjir_lain: null,
  },
  banjir_bandang: {
    kondisi_cuaca_id:"opt_kondisi_cuaca", kecepatan_air_id:"opt_bandang_kecepatan_air",
    kondisi_arus_id:"opt_bandang_kondisi_arus",
    material_terbawa_ids:"opt_bandang_material_terbawa",
    kerusakan_infrastruktur_ids:"opt_bandang_kerusakan_infrastruktur",
  },
  tanah_longsor: {
    kondisi_cuaca_id:"opt_kondisi_cuaca", penyebab_id:"opt_longsor_penyebab",
    jenis_lokasi_id:"opt_longsor_jenis_lokasi", akses_transportasi_id:"opt_longsor_akses_transportasi",
    material_ids:"opt_longsor_material", potensi_susulan_id:"opt_longsor_potensi_susulan",
    dimensi_longsor: null,
  },
  cuaca_ekstrim: {
    kondisi_cuaca_id:"opt_kondisi_cuaca", fenomena_id:"opt_cuaca_fenomena", dampak_pohon_id:"opt_cuaca_dampak_pohon",
    kerusakan_bangunan_id:"opt_cuaca_kerusakan_bangunan",
  },
  kekeringan: {
    sektor_terdampak_ids:"opt_kekeringan_sektor", kondisi_air_id:"opt_kekeringan_kondisi_air",
    durasi_id:"opt_kekeringan_durasi", potensi_risiko_ids:"opt_kekeringan_potensi_risiko",
    upaya_masyarakat_ids:"opt_kekeringan_upaya_masyarakat",
    luas_lahan: null, jumlah_kk: null,
  },
  karhutla: {
    kondisi_api_id:"opt_karhutla_kondisi_api", jenis_lahan_id:"opt_karhutla_jenis_lahan",
    pemilik_lahan_id:"opt_karhutla_pemilik_lahan", jarak_ke_pemukiman_id:"opt_karhutla_jarak_pemukiman",
    sumber_air_id:"opt_karhutla_sumber_air", akses_lokasi_id:"opt_karhutla_akses_lokasi",
    luas_terbakar: null,
  },
  wabah: {
    jenis_penyakit_id:"opt_wabah_jenis_penyakit", sebaran_id:"opt_wabah_sebaran",
    fasilitas_kesehatan_id:"opt_wabah_fasilitas_kesehatan", kondisi_sanitasi_id:"opt_wabah_kondisi_sanitasi",
    jumlah_bergejala: null, kronologi: null,
  },
  gempa_bumi: {
    durasi_id:"opt_gempa_durasi", kekuatan_id:"opt_gempa_kekuatan",
    dampak_struktural_ids:"opt_gempa_dampak_struktural", kerusakan_jalan_ids:"opt_gempa_kerusakan_jalan",
    potensi_susulan_id:"opt_gempa_potensi_susulan", kondisi_warga_id:"opt_gempa_kondisi_warga",
  },
  konflik_sosial: {
    sifat_konflik_id:"opt_konflik_sifat", aktor_id:"opt_konflik_aktor",
    pemicu_id:"opt_konflik_pemicu", jumlah_terlibat_id:"opt_konflik_jumlah_terlibat",
    kerusakan_materil_id:"opt_konflik_kerusakan_materil", aparat_ids:"opt_konflik_aparat",
  },
};

export function resolveLabel(val: any, optKey: string | null, options: any): string {
  if (val === null || val === undefined || val === "") return "-";
  
  let parsedVal = val;
  if (typeof val === "string" && val.startsWith("{") && val.endsWith("}")) {
    const inner = val.slice(1, -1).trim();
    parsedVal = inner ? inner.split(",").map(s => Number(s.trim())) : [];
  }

  if (!optKey || !options) {
    if (Array.isArray(parsedVal)) return parsedVal.join(", ");
    return String(parsedVal);
  }

  const list: any[] = options[optKey] ?? [];
  if (Array.isArray(parsedVal)) {
    const ids = parsedVal as number[];
    return ids.map((id) => list.find((o) => o.id === id)?.label ?? String(id)).join(", ") || "-";
  }
  return list.find((o) => o.id == parsedVal)?.label ?? String(parsedVal);
}

export async function generatePdfReport(lb: any, options: any = null) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(243, 146, 0); // Amber 500
  doc.text("Laporan Bencana Daerah - SiPENA", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Kabupaten Rokan Hulu | ID Laporan: #${lb.id}`, 14, 26);
  doc.text(`Waktu Cetak: ${new Date().toLocaleString("id-ID")}`, 14, 31);
  
  let currentY = 38;

  // 1. Informasi Dasar
  const infoBody = [
    ["Jenis Bencana", lb.jenis_bencana?.replace(/_/g, " ")?.toUpperCase() ?? "-"],
    ["Kecamatan", lb.nama_kecamatan ?? "-"],
    ["Lokasi", lb.lokasi_text ?? "-"],
    ["Waktu Kejadian", lb.waktu_kejadian ? new Date(lb.waktu_kejadian).toLocaleString("id-ID") : "-"],
    ["Pelapor", `${lb.nama_pelapor ?? "-"} (${lb.sumber_laporan ?? "TRC"})`],
    ["Status Siaga", SIAGA_LABEL[lb.status] ?? lb.status],
    ["Koordinat GPS", `${lb.latitude}, ${lb.longitude}`],
    ["Catatan Update", lb.catatan_update ?? "-"],
  ];
  
  autoTable(doc, {
    startY: currentY,
    head: [["Informasi Pelaporan", "Keterangan"]],
    body: infoBody,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }, // Blue
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 2. Detail Bencana (Dinamis)
  const FIELD_UNITS: Record<string, string> = {
    luas_genangan:   "m²",
    luas_terbakar:   "Ha",
    luas_lahan:      "Ha",
    jumlah_bergejala:"jiwa",
    jumlah_kk:       "KK",
    dimensi_longsor: "m",
  };

  if (lb.detail && lb.jenis_bencana) {
    const fieldMap = FIELD_OPT_KEYS[lb.jenis_bencana] ?? {};
    const skip = new Set(["laporan_id", "created_at", "updated_at"]);
    const entries = Object.entries(lb.detail).filter(([k]) => !skip.has(k));
    
    if (entries.length > 0) {
      const detailBody = entries.map(([key, val]) => {
        const optKey = fieldMap[key] ?? null;
        let label = resolveLabel(val, optKey, options);
        
        const unit = FIELD_UNITS[key];
        if (unit && label && label !== "-" && !isNaN(Number(label))) {
          label = `${label} ${unit}`;
        }
        
        const displayKey = key.replace(/_ids?$/, "").replace(/_/g, " ").toUpperCase();
        return [displayKey, label];
      }).filter(([_, label]) => label !== "-" && label !== "null");

      if (detailBody.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [[`Detail Bencana: ${lb.jenis_bencana.replace(/_/g, " ").toUpperCase()}`, "Nilai"]],
          body: detailBody,
          theme: 'grid',
          headStyles: { fillColor: [234, 88, 12] }, // Orange
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }
    }
  }

  // 3. Dampak Manusia (Korban)
  if (lb.korban) {
    autoTable(doc, {
      startY: currentY,
      head: [["Dampak Manusia", "Jumlah Jiwa / KK"]],
      body: [
        ["Meninggal Dunia", String(lb.korban.korban_meninggal ?? 0)],
        ["Luka Berat", String(lb.korban.korban_luka_berat ?? 0)],
        ["Luka Ringan", String(lb.korban.korban_luka_ringan ?? 0)],
        ["Hilang", String(lb.korban.korban_hilang ?? 0)],
        ["Jiwa Mengungsi", String(lb.korban.jiwa_mengungsi ?? 0)],
        ["KK Terdampak", String(lb.korban.kk_mengungsi ?? 0)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }, // Red
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 4. Kerusakan & Logistik
  const k = lb.kerusakan ?? {};
  const fasilitas = Array.isArray(lb.fasilitas_terdampak) ? lb.fasilitas_terdampak.join(", ") : "-";
  const logistik = Array.isArray(lb.kebutuhan_logistik) ? lb.kebutuhan_logistik.join(", ") : "-";
  
  autoTable(doc, {
    startY: currentY,
    head: [["Kerusakan Fisik & Kebutuhan", "Keterangan"]],
    body: [
      ["Rumah Rusak Berat", String(k.rumah_rusak_berat ?? 0)],
      ["Rumah Rusak Sedang", String(k.rumah_rusak_sedang ?? 0)],
      ["Rumah Rusak Ringan", String(k.rumah_rusak_ringan ?? 0)],
      ["Fasilitas Umum Terdampak", fasilitas || "-"],
      ["Catatan Fasilitas", k.catatan_fasilitas_umum || "-"],
      ["Kebutuhan Logistik Mendesak", logistik || "-"],
      ["Catatan Lainnya", k.catatan_lain || "-"],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }, // Emerald
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
  });

  // 5. Dokumentasi Media
  if (lb.fotos && lb.fotos.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246); // Blue
    doc.setFont("Helvetica", "bold");
    doc.text("Dokumentasi Media Kejadian", 14, 20);
    doc.setFont("Helvetica", "normal");
    
    let mediaY = 28;
    for (const foto of lb.fotos) {
      const dataUrl = await getMediaDataUrl(foto);
      if (dataUrl) {
        if (mediaY + 65 > 280) {
          doc.addPage();
          mediaY = 20;
        }
        doc.addImage(dataUrl, "JPEG", 14, mediaY, 90, 50);
        
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(`Nama File: ${foto.file_name || "media_file"}`, 110, mediaY + 15);
        doc.text(`Mime Type: ${foto.mime_type || "image/jpeg"}`, 110, mediaY + 22);
        doc.text(`Tgl Upload: ${foto.created_at ? new Date(foto.created_at).toLocaleDateString("id-ID") : "-"}`, 110, mediaY + 29);
        
        mediaY += 58;
      }
    }
  }

  doc.save(`laporan_bencana_${lb.id}.pdf`);
}

function toDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      const reader = new FileReader();
      reader.onloadend = function() {
        resolve(reader.result as string);
      }
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = () => reject(new Error("Gagal memuat gambar"));
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  });
}

function getVideoScreenshot(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.currentTime = 1.0;
    
    const handleSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL("image/jpeg");
          cleanup();
          resolve(dataURL);
        } else {
          reject(new Error("Canvas context is null"));
        }
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    const handleError = (e: any) => {
      cleanup();
      reject(new Error("Video load error"));
    };

    const cleanup = () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
      video.src = "";
      video.load();
    };

    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);
    
    video.load();
  });
}

async function getMediaDataUrl(foto: any): Promise<string | null> {
  try {
    const path = foto.file_path || foto.url;
    if (!path) return null;
    const fullUrl = path.startsWith("http") ? path : window.location.origin + (path.startsWith("/") ? path : "/" + path);
    
    const isVideo = foto.mime_type?.startsWith("video/") || 
      ["mp4", "webm", "ogg", "mov", "mkv", "3gp", "avi"].includes(path.split('.').pop()?.toLowerCase() ?? "");
      
    if (isVideo) {
      return await getVideoScreenshot(fullUrl);
    } else {
      return await toDataURL(fullUrl);
    }
  } catch (e) {
    console.warn("Failed to load media for PDF:", e);
    return null;
  }
}

function reconstructInitialState(lb: any, kecamatanList: any[]) {
  const initialLb = JSON.parse(JSON.stringify(lb));
  const logs = lb.logs ?? [];
  const reverseLogs = [...logs].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  for (const log of reverseLogs) {
    if (log.aksi === "update_status") continue;
    let oldVal: any = null;
    try {
      oldVal = typeof log.old_value === 'string' ? JSON.parse(log.old_value) : log.old_value;
    } catch (e) {}
    
    if (!oldVal) continue;
    
    Object.keys(oldVal).forEach((key) => {
      const val = oldVal[key];
      if (key === "koordinat") {
        const parts = String(val).split(",");
        if (parts.length === 2) {
          initialLb.latitude = parts[0].trim();
          initialLb.longitude = parts[1].trim();
        }
      } else if (key === "kecamatan_id") {
        initialLb.kecamatan_id = val;
        if (kecamatanList) {
          const kec = kecamatanList.find((k: any) => String(k.id) === String(val));
          if (kec) {
            initialLb.nama_kecamatan = kec.nama_kecamatan;
          }
        }
      } else if (key === "nama_kecamatan") {
        initialLb.nama_kecamatan = val;
      } else if (key === "waktu_kejadian") {
        initialLb.waktu_kejadian = val;
      } else if (key === "nama_pelapor") {
        initialLb.nama_pelapor = val;
      } else if (key === "lokasi_text") {
        initialLb.lokasi_text = val;
      } else if (key === "status") {
        initialLb.status = val;
      } else if (key === "catatan_update") {
        initialLb.catatan_update = val;
      } else if (key === "fasilitas_terdampak") {
        initialLb.fasilitas_terdampak = val;
      } else if (key === "kebutuhan_logistik") {
        initialLb.kebutuhan_logistik = val;
      } else if (key.startsWith("korban_") || key === "kk_mengungsi" || key === "jiwa_mengungsi") {
        if (!initialLb.korban) initialLb.korban = {};
        initialLb.korban[key] = val;
      } else if (key.startsWith("rumah_rusak_") || key === "catatan_lain" || key === "catatan_fasilitas_umum") {
        if (!initialLb.kerusakan) initialLb.kerusakan = {};
        initialLb.kerusakan[key] = val;
      } else {
        if (lb.jenis_bencana && (key in (FIELD_OPT_KEYS[lb.jenis_bencana] ?? {}))) {
          if (!initialLb.detail) initialLb.detail = {};
          initialLb.detail[key] = val;
        } else {
          initialLb[key] = val;
        }
      }
    });
  }

  const sortedLogs = [...logs].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  if (sortedLogs.length > 0) {
    const firstLogTime = new Date(sortedLogs[0].created_at).getTime();
    initialLb.fotos = (lb.fotos ?? []).filter((f: any) => {
      if (!f.created_at) return true;
      return new Date(f.created_at).getTime() < firstLogTime;
    });
  } else {
    initialLb.fotos = lb.fotos ?? [];
  }
  
  return initialLb;
}

export async function generateLogPdfReport(lb: any, options: any = null, kecamatanList: any[] = []) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(225, 29, 72); // Rose 600
  doc.setFont("Helvetica", "bold");
  doc.text("Perkembangan Laporan Kejadian - SiPENA", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("Helvetica", "normal");
  doc.text(`Kabupaten Rokan Hulu | ID Laporan: #${lb.id} | Bencana: ${lb.jenis_bencana?.replace(/_/g, " ")?.toUpperCase()}`, 14, 26);
  doc.text(`Waktu Cetak: ${new Date().toLocaleString("id-ID")}`, 14, 31);
  
  let currentY = 38;

  const logs = lb.logs ?? [];
  const sortedLogs = [...logs].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.setFont("Helvetica", "bold");
  doc.text("1. Laporan Awal Masuk", 14, currentY);
  doc.setFont("Helvetica", "normal");
  currentY += 6;

  const initialLb = reconstructInitialState(lb, kecamatanList);

  // 1.1 Informasi Pelaporan
  const infoBody = [
    ["Jenis Bencana", initialLb.jenis_bencana?.replace(/_/g, " ")?.toUpperCase() ?? "-"],
    ["Kecamatan", initialLb.nama_kecamatan ?? "-"],
    ["Lokasi", initialLb.lokasi_text ?? "-"],
    ["Waktu Kejadian", initialLb.waktu_kejadian ? new Date(initialLb.waktu_kejadian).toLocaleString("id-ID") : "-"],
    ["Pelapor", `${initialLb.nama_pelapor ?? "-"} (${initialLb.sumber_laporan ?? "TRC"})`],
    ["Status Siaga", SIAGA_LABEL[initialLb.status] ?? initialLb.status],
    ["Koordinat GPS", `${initialLb.latitude}, ${initialLb.longitude}`],
    ["Catatan", initialLb.catatan_update ?? "-"],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Informasi Pelaporan (Awal)", "Keterangan"]],
    body: infoBody,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] }, // Slate
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 1.2 Detail Bencana (Dinamis)
  const FIELD_UNITS: Record<string, string> = {
    luas_genangan:   "m²",
    luas_terbakar:   "Ha",
    luas_lahan:      "Ha",
    jumlah_bergejala:"jiwa",
    jumlah_kk:       "KK",
    dimensi_longsor: "m",
  };

  if (initialLb.detail && initialLb.jenis_bencana) {
    const fieldMap = FIELD_OPT_KEYS[initialLb.jenis_bencana] ?? {};
    const skip = new Set(["laporan_id", "created_at", "updated_at"]);
    const entries = Object.entries(initialLb.detail).filter(([k]) => !skip.has(k));
    
    if (entries.length > 0) {
      const detailBody = entries.map(([key, val]) => {
        const optKey = fieldMap[key] ?? null;
        let label = resolveLabel(val, optKey, options);
        
        const unit = FIELD_UNITS[key];
        if (unit && label && label !== "-" && !isNaN(Number(label))) {
          label = `${label} ${unit}`;
        }
        
        const displayKey = key.replace(/_ids?$/, "").replace(/_/g, " ").toUpperCase();
        return [displayKey, label];
      }).filter(([_, label]) => label !== "-" && label !== "null");

      if (detailBody.length > 0) {
        if (currentY + 25 > 280) {
          doc.addPage();
          currentY = 20;
        }
        autoTable(doc, {
          startY: currentY,
          head: [[`Detail Bencana: ${initialLb.jenis_bencana.replace(/_/g, " ").toUpperCase()} (Awal)`, "Nilai"]],
          body: detailBody,
          theme: 'grid',
          headStyles: { fillColor: [71, 85, 105] }, // Slate
          styles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
        });
        currentY = (doc as any).lastAutoTable.finalY + 6;
      }
    }
  }

  // 1.3 Dampak Manusia
  if (initialLb.korban) {
    if (currentY + 25 > 280) {
      doc.addPage();
      currentY = 20;
    }
    autoTable(doc, {
      startY: currentY,
      head: [["Dampak Manusia (Awal)", "Jumlah Jiwa / KK"]],
      body: [
        ["Meninggal Dunia", String(initialLb.korban.korban_meninggal ?? 0)],
        ["Luka Berat", String(initialLb.korban.korban_luka_berat ?? 0)],
        ["Luka Ringan", String(initialLb.korban.korban_luka_ringan ?? 0)],
        ["Hilang", String(initialLb.korban.korban_hilang ?? 0)],
        ["Jiwa Mengungsi", String(initialLb.korban.jiwa_mengungsi ?? 0)],
        ["KK Terdampak", String(initialLb.korban.kk_mengungsi ?? 0)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] }, // Slate
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // 1.4 Kerusakan Fisik & Kebutuhan
  const ik = initialLb.kerusakan ?? {};
  const ifasilitas = Array.isArray(initialLb.fasilitas_terdampak) ? initialLb.fasilitas_terdampak.join(", ") : "-";
  const ilogistik = Array.isArray(initialLb.kebutuhan_logistik) ? initialLb.kebutuhan_logistik.join(", ") : "-";

  if (currentY + 25 > 280) {
    doc.addPage();
    currentY = 20;
  }
  autoTable(doc, {
    startY: currentY,
    head: [["Kerusakan Fisik & Kebutuhan (Awal)", "Keterangan"]],
    body: [
      ["Rumah Rusak Berat", String(ik.rumah_rusak_berat ?? 0)],
      ["Rumah Rusak Sedang", String(ik.rumah_rusak_sedang ?? 0)],
      ["Rumah Rusak Ringan", String(ik.rumah_rusak_ringan ?? 0)],
      ["Fasilitas Umum Terdampak", ifasilitas || "-"],
      ["Catatan Fasilitas", ik.catatan_fasilitas_umum || "-"],
      ["Kebutuhan Logistik Mendesak", ilogistik || "-"],
      ["Catatan Lainnya", ik.catatan_lain || "-"],
    ],
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] }, // Slate
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
  });
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // 1.5 Dokumentasi Media Awal
  if (initialLb.fotos && initialLb.fotos.length > 0) {
    if (currentY + 25 > 280) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.text("Media Dokumentasi Awal", 14, currentY);
    doc.setFont("Helvetica", "normal");
    currentY += 4;
    
    let mediaY = currentY;
    for (const foto of initialLb.fotos) {
      const dataUrl = await getMediaDataUrl(foto);
      if (dataUrl) {
        if (mediaY + 45 > 280) {
          doc.addPage();
          mediaY = 20;
        }
        doc.addImage(dataUrl, "JPEG", 14, mediaY, 60, 35);
        
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.text(`Nama File: ${foto.file_name || "media_file"}`, 80, mediaY + 10);
        doc.text(`Mime Type: ${foto.mime_type || "image/jpeg"}`, 80, mediaY + 16);
        doc.text(`Tgl Upload: ${foto.created_at ? new Date(foto.created_at).toLocaleDateString("id-ID") : "-"}`, 80, mediaY + 22);
        
        mediaY += 40;
      }
    }
    currentY = mediaY + 6;
  }

  // Adjust spacing before section 2 if page boundary is near
  if (currentY + 20 > 280) {
    doc.addPage();
    currentY = 20;
  }


  if (sortedLogs.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    
    if (currentY + 15 > 280) {
      doc.addPage();
      currentY = 20;
    }
    doc.text("2. Riwayat Perubahan & Perkembangan", 14, currentY);
    doc.setFont("Helvetica", "normal");
    currentY += 6;

    for (let index = 0; index < sortedLogs.length; index++) {
      const log = sortedLogs[index];
      let oldVal: any = null;
      let newVal: any = null;
      try {
        oldVal = typeof log.old_value === 'string' ? JSON.parse(log.old_value) : log.old_value;
        newVal = typeof log.new_value === 'string' ? JSON.parse(log.new_value) : log.new_value;
      } catch(e) {}

      const diffRows: string[][] = [];
      
      const formatValueLocal = (key: string, val: any): string => {
        if (val === null || val === undefined || val === "") return "-";
        if (key === "kecamatan_id" && kecamatanList) {
          const kec = kecamatanList.find((k: any) => String(k.id) === String(val));
          return kec ? kec.nama_kecamatan : `Kecamatan #${val}`;
        }
        if (key === "waktu_kejadian") {
          return new Date(val).toLocaleString("id-ID");
        }
        if (key.includes("korban") || key.includes("jiwa")) {
          return `${val} jiwa`;
        }
        if (key.includes("kk")) {
          return `${val} KK`;
        }
        if (key.includes("rumah_rusak")) {
          return `${val} unit`;
        }
        if (lb.jenis_bencana && FIELD_OPT_KEYS[lb.jenis_bencana]?.[key]) {
          const optKey = FIELD_OPT_KEYS[lb.jenis_bencana][key];
          const resolved = resolveLabel(val, optKey, options);
          if (resolved !== "-") return resolved;
        }
        if (Array.isArray(val)) {
          return val.join(", ");
        }
        return String(val);
      };

      if (log.aksi !== "update_status" && oldVal && newVal && Object.keys(newVal).length > 0) {
        Object.keys(newVal).forEach((key) => {
          const oldFormatted = formatValueLocal(key, oldVal[key]);
          const newFormatted = formatValueLocal(key, newVal[key]);
          if (!newFormatted) return;
          if (oldFormatted === newFormatted) return;
          const label = key.replace(/_/g, " ").toUpperCase();
          diffRows.push([label, oldFormatted, newFormatted]);
        });
      }

      const logTime = log.created_at ? new Date(log.created_at).toLocaleString("id-ID") : "-";
      const logUser = log.user_name || log.user?.name || "System";
      const titleText = `Update #${index + 1} - Oleh ${logUser} [${logTime}]`;

      if (currentY + 30 > 280) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(titleText, 14, currentY);
      doc.setFont("Helvetica", "normal");
      currentY += 4;

      if (diffRows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [["Kolom / Field", "Sebelum", "Sesudah"]],
          body: diffRows,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] }, // Blue
          styles: { fontSize: 8, cellPadding: 2 },
        });
        currentY = (doc as any).lastAutoTable.finalY + 8;
      } else {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Catatan: ${log.catatan || "-"}`, 14, currentY);
        currentY += 8;
      }
    }
  }

  if (lb.fotos && lb.fotos.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(225, 29, 72); // Rose
    doc.setFont("Helvetica", "bold");
    doc.text("3. Dokumentasi Media Terkini", 14, 20);
    doc.setFont("Helvetica", "normal");
    
    let mediaY = 28;
    for (const foto of lb.fotos) {
      const dataUrl = await getMediaDataUrl(foto);
      if (dataUrl) {
        if (mediaY + 65 > 280) {
          doc.addPage();
          mediaY = 20;
        }
        doc.addImage(dataUrl, "JPEG", 14, mediaY, 90, 50);
        
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.text(`Nama File: ${foto.file_name || "media_file"}`, 110, mediaY + 15);
        doc.text(`Mime Type: ${foto.mime_type || "image/jpeg"}`, 110, mediaY + 22);
        doc.text(`Tgl Upload: ${foto.created_at ? new Date(foto.created_at).toLocaleDateString("id-ID") : "-"}`, 110, mediaY + 29);
        
        mediaY += 58;
      }
    }
  }

  doc.save(`perkembangan_laporan_${lb.id}.pdf`);
}
