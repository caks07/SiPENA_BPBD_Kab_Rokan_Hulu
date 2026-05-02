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
  if (lb.detail && lb.jenis_bencana) {
    const fieldMap = FIELD_OPT_KEYS[lb.jenis_bencana] ?? {};
    const skip = new Set(["laporan_id", "created_at", "updated_at"]);
    const entries = Object.entries(lb.detail).filter(([k]) => !skip.has(k));
    
    if (entries.length > 0) {
      const detailBody = entries.map(([key, val]) => {
        const optKey = fieldMap[key] ?? null;
        const label = resolveLabel(val, optKey, options);
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

  doc.save(`laporan_bencana_${lb.id}.pdf`);
}
