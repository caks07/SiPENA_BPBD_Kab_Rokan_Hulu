export type Role = "admin" | "admin_kab" | "pimpinan" | "operator";

export type Laporan = {
  id: number;
  jenis_bencana: string;
  nama_pelapor: string;
  lokasi_text: string;
  latitude: number;
  longitude: number;
  status: string;
  severity_level: number | null;
  waktu_kejadian: string;
  kecamatan_id: number;
  kecamatan?: { id: number; nama_kecamatan: string };
};
