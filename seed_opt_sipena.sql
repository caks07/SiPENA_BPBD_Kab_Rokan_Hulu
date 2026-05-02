-- Seed data untuk tabel opt_* SiPENA
-- Disusun dari daftar pertanyaan/form dan ERD yang Anda kirim.

INSERT INTO opt_kondisi_cuaca (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('cerah', 'Cerah', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mendung', 'Mendung', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('hujan_ringan', 'Hujan Ringan', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('hujan_sedang', 'Hujan Sedang', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('hujan_lebat', 'Hujan Lebat', 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('hujan_petir', 'Hujan Petir', 6, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_fasilitas_umum (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('sekolah_madrasah', 'Sekolah / Madrasah', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('masjid_musholla_rumah_ibadah', 'Masjid / Musholla / Rumah Ibadah', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('puskesmas_pustu_rs', 'Puskesmas / Pustu / RS', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kantor_pemerintahan', 'Kantor Pemerintahan', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pasar_sarana_ekonomi', 'Pasar / Sarana Ekonomi', 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('jembatan_jalan_putus', 'Jembatan / Jalan Putus', 6, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('jaringan_listrik_telkom', 'Jaringan Listrik / Telkom', 7, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sarana_air_bersih', 'Sarana Air Bersih (Pamsimas/Sumur Umum)', 8, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_kebutuhan_logistik (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('bahan_pangan', 'Bahan Pangan', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('air_bersih_sanitasi', 'Air Bersih & Perlengkapan Sanitasi', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tenda_terpal_selimut', 'Tenda / Terpal / Selimut', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perlengkapan_bayi', 'Perlengkapan Bayi', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('obat_obatan_tim_medis', 'Obat-obatan & Tim Medis', 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('alat_berat', 'Alat Berat', 6, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perlengkapan_evakuasi', 'Perlengkapan Evakuasi', 7, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_banjir_penyebab (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('curah_hujan_tinggi', 'Curah Hujan Tinggi', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('luapan_sungai', 'Luapan Sungai', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('drainase_buruk_tersumbat', 'Drainase Buruk / Tersumbat', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tanggul_jebol', 'Tanggul Jebol', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kiriman_air_dari_hulu', 'Kiriman Air dari Hulu', 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_banjir_ketinggian (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('mata_kaki_10_30_cm', 'Mata Kaki (10 - 30 cm)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lutut_orang_dewasa_30_60_cm', 'Lutut Orang Dewasa (30 - 60 cm)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pinggang_dada_60_100_cm', 'Pinggang/Dada (60 - 100 cm)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('diatas_100_cm', 'Diatas 100 cm', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_banjir_kondisi_air (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('air_terus_meningkat', 'Air Terus Meningkat (Naik)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bertahan_statis', 'Bertahan (Statis)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mulai_surut', 'Mulai Surut', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_bandang_kecepatan_air (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('sangat_cepat', 'Sangat Cepat', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bertahap', 'Bertahap', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_bandang_material_terbawa (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('lumpur_tebal', 'Lumpur Tebal', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('batang_pohon_material_kayu', 'Batang Pohon / Material Kayu', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('batu_batuan_kerikil', 'Batu-batuan / Kerikil', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sampah_puing_bangunan', 'Sampah / Puing Bangunan', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_bandang_kondisi_arus (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('arus_sangat_deras', 'Arus Sangat Deras', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('arus_mulai_melambat', 'Arus Mulai Melambat', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('air_sudah_surut', 'Air Sudah Surut', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_bandang_kerusakan_infrastruktur (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('jalan_terputus_amblas', 'Jalan Terputus / Amblas', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('jembatan_hanyut_rusak_berat', 'Jembatan Hanyut / Rusak Berat', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bangunan_hanyut_rumah_fasum', 'Bangunan Hanyut (Rumah/Fasum)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lahan_pertanian_hancur_total', 'Lahan Pertanian Hancur Total', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_longsor_penyebab (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('hujan_lebat', 'Hujan Lebat', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('labilnya_tanah', 'Labilnya Tanah', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kebocoran_pipa', 'Kebocoran Pipa', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_longsor_jenis_lokasi (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('tebing_jalan', 'Tebing Jalan (Menutup akses transportasi)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pemukiman_warga', 'Pemukiman Warga (Mengenai rumah)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lahan_pertanian_perkebunan', 'Lahan Pertanian / Perkebunan', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bantaran_sungai', 'Bantaran Sungai', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_longsor_akses_transportasi (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('akses_putus_total', 'Akses Putus Total', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('hanya_roda2', 'Hanya Bisa Dilalui Kendaraan Roda 2', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('buka_tutup', 'Buka Tutup', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('normal', 'Normal', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_longsor_material (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('tanah', 'Tanah', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('batu', 'Batu', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pohon_kayu', 'Pohon/Kayu', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lumpur', 'Lumpur', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_longsor_potensi_susulan (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('tinggi', 'Tinggi', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sedang', 'Sedang', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('rendah', 'Rendah', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_cuaca_fenomena (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('angin_puting_beliung', 'Angin Puting Beliung', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('angin_kencang', 'Angin Kencang', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('hujan_es', 'Hujan Es', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kilat_petir_intens', 'Kilat / Petir yang Intens', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_cuaca_dampak_pohon (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('tidak_ada', 'Tidak Ada', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pohon_tumbang_menghalangi_jalan', 'Pohon Tumbang (Menghalangi jalan)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pohon_tumbang_menimpa_rumah_bangunan', 'Pohon Tumbang (Menimpa rumah/bangunan)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pohon_tumbang_menimpa_kabel_listrik_telepon', 'Pohon Tumbang (Menimpa kabel listrik/telepon)', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_cuaca_kerusakan_bangunan (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('atap_terlepas', 'Atap Terlepas', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tertimpa_pohon', 'Tertimpa Pohon', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dinding_roboh', 'Dinding Roboh', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_kekeringan_sektor (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('rumah_tangga', 'Rumah Tangga (Kesulitan air minum/mandi)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pertanian_perkebunan', 'Pertanian / Perkebunan (Tanaman layu/mati)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('peternakan', 'Peternakan (Kekurangan air untuk hewan ternak)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sanitasi_fasilitas_umum', 'Sanitasi Fasilitas Umum (Sekolah/Puskesmas/Rumah Ibadah)', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_kekeringan_kondisi_air (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('mengering_total', 'Mengering Total', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('debit_menurun_drastis', 'Debit Air Menurun Drastis', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('masih_mengalir_mulai_keruh', 'Masih Mengalir/Tersedia namun mulai keruh', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('jarak_sangat_jauh', 'Jarak ke sumber air terdekat menjadi sangat jauh (> 1 km)', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_kekeringan_durasi (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('kurang_dari_2_minggu', '< 2 Minggu', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dua_sampai_4_minggu', '2 - 4 Minggu', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('satu_sampai_2_bulan', '1 - 2 Bulan', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dua_bulan', '2 Bulan', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_kekeringan_potensi_risiko (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('karhutla', 'Kerawanan Kebakaran Hutan dan Lahan (Karhutla)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('penyakit_diare_kulit', 'Munculnya Penyakit (Diare/Penyakit Kulit akibat air tidak layak)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('konflik_sosial', 'Konflik Sosial (Berebut sumber air)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_kekeringan_upaya_masyarakat (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('sumur_gali_baru', 'Membuat sumur gali baru secara mandiri', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('beli_air_tangki_swasta', 'Membeli air bersih dari tangki swasta', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ambil_air_sungai', 'Mengambil air dari sungai yang masih mengalir (meski jauh)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_karhutla_kondisi_api (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('aktif', 'Api Masih Berkobar (Aktif)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pendinginan', 'Api Sudah Padam, Masih Berasap (Pendinginan)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('padam_total', 'Api Sudah Padam Total', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_karhutla_jenis_lahan (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('lahan_gambut', 'Lahan Gambut', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lahan_mineral_tanah_keras_lahan_imbas_tumbang', 'Lahan Mineral / Tanah Keras / Lahan Imbas Tumbang', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perkebunan_sawit_karet', 'Perkebunan Sawit / Karet', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('hutan_semak_belukar', 'Hutan / Semak Belukar', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_karhutla_pemilik_lahan (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('milik_masyarakat_perorangan', 'Milik Masyarakat/Perorangan', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('milik_perusahaan_hgu', 'Milik Perusahaan (HGU)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lahan_terbuka_milik_negara', 'Lahan Terbuka / Milik Negara', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('belum_diketahui', 'Belum Diketahui', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_karhutla_jarak_pemukiman (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('kurang_500m', '< 500 Meter (Sangat Terancam)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lebih_500m', '> 500 Meter', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_karhutla_sumber_air (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('tersedia_di_lokasi', 'Tersedia di Lokasi (Kanal/Embong/Kolam)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('jauh_dari_lokasi', 'Jauh dari Lokasi (Perlu selang panjang > 200m)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tidak_ada_sumber_air', 'Tidak Ada Sumber Air (Butuh suplai mobil tangki)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_karhutla_akses_lokasi (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('roda4', 'Bisa Dilalui Kendaraan Roda 4', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('roda2', 'Hanya Bisa Dilalui Kendaraan Roda 2', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('jalan_kaki', 'Hanya Bisa Ditempuh dengan Jalan Kaki', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_wabah_jenis_penyakit (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('gejala_saluran_pernapasan', 'Gejala Saluran Pernapasan (Batuk, Sesak Napas)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gejala_pencernaan', 'Gejala Pencernaan (Diare Massal, Muntah)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gejala_kulit', 'Gejala Kulit (Gatal-gatal, Ruam, Melepuh)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demam_tinggi_berjamaah', 'Demam Tinggi Berjamaah (Dugaan DBD/Malaria/Tipus)', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('keracunan_makanan', 'Keracunan Makanan (Gejala serentak setelah acara tertentu)', 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_wabah_sebaran (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('satu_rt_rw', 'Terfokus di satu RT/RW saja', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('satu_desa_kelurahan', 'Tersebar di satu Desa/Kelurahan', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lintas_kecamatan', 'Lintas Kecamatan', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lokasi_khusus', 'Lokasi Khusus (Sekolah, Pondok Pesantren, Perkantoran)', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_wabah_fasilitas_kesehatan (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('puskesmas', 'Puskesmas', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bidan_desa_mantri', 'Bidan Desa / Mantri', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('rsud', 'Rumah Sakit Umum Daerah (RSUD)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('belum_ada_penanganan_medis', 'Belum ada penanganan medis sama sekali', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_wabah_kondisi_sanitasi (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('layak_bersih', 'Layak / Bersih', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tercemar', 'Tercemar (Dugaan sumber penularan)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sanitasi_buruk', 'Sanitasi Buruk (Drainase mampet/Sampah menumpuk)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_gempa_durasi (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('singkat_kurang_5_detik', 'Singkat ( < 5 Detik)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sedang_5_15_detik', 'Sedang (5 - 15 Detik)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lama_lebih_15_detik', 'Lama ( > 15 Detik)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_gempa_kekuatan (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('lemah', 'Lemah', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kuat', 'Kuat', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sangat_kuat', 'Sangat Kuat', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_gempa_dampak_struktural (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('retak_rambut', 'Retak Rambut', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('retak_struktur', 'Retak Struktur', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('atap_plafon_runtuh', 'Atap/Plafon Runtuh', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bangunan_roboh_sebagian', 'Bangunan Roboh Sebagian', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bangunan_roboh_total', 'Bangunan Roboh Total', 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_gempa_kerusakan_jalan (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('terdapat_rekahan_tanah', 'Terdapat Rekahan Tanah', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('jalan_amblas_bergelombang', 'Jalan Amblas / Bergelombang', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pagar_tembok_pembatas_roboh', 'Pagar / Tembok Pembatas Roboh', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_gempa_potensi_susulan (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('potensi_longsor', 'Teramati Lereng/Tebing yang menjadi tidak stabil (Potensi Longsor)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kebocoran_pipa_gas_korsleting_listrik_masif', 'Terdapat kebocoran pipa gas atau korsleting listrik masif', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tidak_ada_ancaman_terlihat', 'Tidak ada ancaman terlihat', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_gempa_kondisi_warga (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('tenang_di_rumah', 'Tenang / Tetap di dalam rumah', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('panik_keluar_ke_lapangan_terbuka', 'Panik / Keluar rumah ke lapangan terbuka', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('titik_kumpul_tenda_darurat', 'Berada di titik kumpul/tenda darurat', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_konflik_sifat (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('bentrokan_fisik', 'Bentrokan Fisik (Antar kelompok/warga)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demonstrasi_unjuk_rasa_masif', 'Demonstrasi / Unjuk Rasa Masif', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('penutupan_pemblokiran_akses', 'Penutupan / Pemblokiran Akses (Jalan/Lahan)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('intimidasi_ketegangan_tanpa_kekerasan_fisik', 'Intimidasi / Ketegangan Tanpa Kekerasan Fisik', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('perusakan_properti_fasilitas', 'Perusakan Properti / Fasilitas', 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_konflik_aktor (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('antar_warga_kelompok_masyarakat', 'Antar Warga / Kelompok Masyarakat', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('warga_dengan_perusahaan_hgu_konflik_lahan', 'Warga dengan Perusahaan (HGU/Konflik Lahan)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('warga_dengan_instansi_pemerintah', 'Warga dengan Instansi Pemerintah', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('antar_ormas', 'Antar Organisasi Kemasyarakatan (Ormas)', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_konflik_pemicu (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('sengketa_lahan', 'Masalah Sengketa Lahan', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('isu_sara', 'Isu SARA (Suku, Agama, Ras, Antargolongan)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dampak_lingkungan', 'Dampak Lingkungan (Limbah/Polusi)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kesenjangan_sosial_ketenagakerjaan', 'Kesenjangan Sosial / Masalah Ketenagakerjaan', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_konflik_jumlah_terlibat (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('kecil_lt_20', 'Kelompok Kecil (< 20 Orang)', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sedang_20_100', 'Kelompok Sedang (20 - 100 Orang)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('besar_gt_100', 'Kelompok Besar / Massa (> 100 Orang)', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_konflik_kerusakan_materil (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('kendaraan_terbakar_rusak', 'Kendaraan Terbakar / Rusak', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('rumah_bangunan_rusak', 'Rumah / Bangunan Rusak', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('fasilitas_umum_dirusak', 'Fasilitas Umum Dirusak', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tidak_ada_kerusakan_materil', 'Tidak Ada Kerusakan Materil', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;

INSERT INTO opt_konflik_aparat (kode, label, urutan, is_other, is_active, created_at, updated_at)
VALUES
  ('belum_ada_aparat', 'Belum Ada Aparat', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kepolisian', 'Sudah Ada Personel Kepolisian (Polres/Polsek)', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tni', 'Sudah Ada Personel TNI', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('satpol_pp', 'Sudah Ada Personel Satpol PP', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lainnya', 'Other / Yang lain', 99, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (kode) DO NOTHING;
