<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReferenceOptionsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles
        DB::table('roles')->upsert([
            ['nama_role' => 'admin', 'keterangan' => 'Admin Kabupaten', 'created_at' => now(), 'updated_at' => now()],
            ['nama_role' => 'pimpinan', 'keterangan' => 'Kepala BPBD', 'created_at' => now(), 'updated_at' => now()],
            ['nama_role' => 'operator', 'keterangan' => 'Admin Kecamatan', 'created_at' => now(), 'updated_at' => now()],
        ], ['nama_role'], ['keterangan']);

        // 2. Kecamatan (Update with Centroids & Polygons)
        $kecamatanData = [
            '1401010' => ['nama' => 'Rambah', 'lat' => 0.817653, 'lng' => 100.242252, 'ring' => [[100.220,0.820],[100.350,0.820],[100.350,0.890],[100.220,0.890],[100.220,0.820]]],
            '1401020' => ['nama' => 'Rambah Samo', 'lat' => 0.801450, 'lng' => 100.418951, 'ring' => [[100.280,0.870],[100.380,0.870],[100.380,0.940],[100.280,0.940],[100.280,0.870]]],
            '1401030' => ['nama' => 'Rambah Hilir', 'lat' => 0.987446, 'lng' => 100.356578, 'ring' => [[100.200,0.790],[100.290,0.790],[100.290,0.860],[100.200,0.860],[100.200,0.790]]],
            '1401040' => ['nama' => 'Ujung Batu', 'lat' => 0.698903, 'lng' => 100.539487, 'ring' => [[100.070,1.050],[100.190,1.050],[100.190,1.130],[100.070,1.130],[100.070,1.050]]],
            '1401050' => ['nama' => 'Tambusai', 'lat' => 1.051850, 'lng' => 100.195799, 'ring' => [[100.020,1.100],[100.160,1.100],[100.160,1.210],[100.020,1.210],[100.020,1.100]]],
            '1401060' => ['nama' => 'Tambusai Utara', 'lat' => 1.275649, 'lng' => 100.254024, 'ring' => [[99.970,1.170],[100.110,1.170],[100.110,1.270],[99.970,1.270],[99.970,1.170]]],
            '1401070' => ['nama' => 'Kunto Darussalam', 'lat' => 0.875898, 'lng' => 100.651526, 'ring' => [[100.130,1.290],[100.270,1.290],[100.270,1.400],[100.130,1.400],[100.130,1.290]]],
            '1401080' => ['nama' => 'Rokan IV Koto', 'lat' => 0.584637, 'lng' => 100.325796, 'ring' => [[100.080,0.720],[100.210,0.720],[100.210,0.810],[100.080,0.810],[100.080,0.720]]],
            '1401090' => ['nama' => 'Pendalian IV Koto', 'lat' => 0.490602, 'lng' => 100.486788, 'ring' => [[100.160,0.610],[100.270,0.610],[100.270,0.700],[100.160,0.700],[100.160,0.610]]],
            '1401100' => ['nama' => 'Tandun', 'lat' => 0.596585, 'lng' => 100.617389, 'ring' => [[100.350,0.950],[100.460,0.950],[100.460,1.030],[100.350,1.030],[100.350,0.950]]],
            '1401110' => ['nama' => 'Kabun', 'lat' => 0.456143, 'lng' => 100.746557, 'ring' => [[100.390,0.990],[100.490,0.990],[100.490,1.060],[100.390,1.060],[100.390,0.990]]],
            '1401120' => ['nama' => 'Pagaran Tapah Darussalam', 'lat' => 0.784875, 'lng' => 100.601157, 'ring' => [[100.250,1.080],[100.360,1.080],[100.360,1.170],[100.250,1.170],[100.250,1.080]]],
            '1401130' => ['nama' => 'Bonai Darussalam', 'lat' => 1.268177, 'lng' => 100.852487, 'ring' => [[100.500,1.000],[100.680,1.000],[100.680,1.120],[100.500,1.120],[100.500,1.000]]],
            '1401140' => ['nama' => 'Kepenuhan', 'lat' => 1.204929, 'lng' => 100.632461, 'ring' => [[100.280,1.260],[100.400,1.260],[100.400,1.340],[100.280,1.340],[100.280,1.260]]],
            '1401150' => ['nama' => 'Kepenuhan Hulu', 'lat' => 0.965211, 'lng' => 100.488346, 'ring' => [[100.360,1.300],[100.470,1.300],[100.470,1.390],[100.360,1.390],[100.360,1.300]]],
            '1401160' => ['nama' => 'Bangun Purba', 'lat' => 0.923035, 'lng' => 100.180455, 'ring' => [[100.250,0.900],[100.320,0.900],[100.320,0.960],[100.250,0.960],[100.250,0.900]]],
        ];

        foreach ($kecamatanData as $kode => $data) {
            $coords = implode(', ', array_map(fn($p) => "{$p[0]} {$p[1]}", $data['ring']));
            $wkt = "MULTIPOLYGON((({$coords})))";

            // Upsert check manually since we have raw expressions
            $exists = DB::table('kecamatan')->where('kode_kecamatan', $kode)->exists();
            if ($exists) {
                DB::table('kecamatan')->where('kode_kecamatan', $kode)->update([
                    'nama_kecamatan' => $data['nama'],
                    'latitude_default' => $data['lat'],
                    'longitude_default' => $data['lng'],
                    'titik_default' => DB::raw("ST_SetSRID(ST_MakePoint({$data['lng']}, {$data['lat']}), 4326)"),
                    'polygon' => DB::raw("ST_SetSRID(ST_GeomFromText('{$wkt}'), 4326)"),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('kecamatan')->insert([
                    'kode_kecamatan' => $kode,
                    'nama_kecamatan' => $data['nama'],
                    'latitude_default' => $data['lat'],
                    'longitude_default' => $data['lng'],
                    'titik_default' => DB::raw("ST_SetSRID(ST_MakePoint({$data['lng']}, {$data['lat']}), 4326)"),
                    'polygon' => DB::raw("ST_SetSRID(ST_GeomFromText('{$wkt}'), 4326)"),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. Option Tables
        $opts = [
            'opt_kondisi_cuaca' => [
                ['cerah','Cerah',1],['mendung','Mendung',2],['hujan_ringan','Hujan Ringan',3],
                ['hujan_sedang','Hujan Sedang',4],['hujan_lebat','Hujan Lebat',5],['hujan_petir','Hujan Petir',6],
            ],
            'opt_fasilitas_umum' => [
                ['sekolah_madrasah','Sekolah / Madrasah',1],['masjid_musholla','Masjid / Musholla / Rumah Ibadah',2],
                ['puskesmas_pustu_rs','Puskesmas / Pustu / RS',3],['kantor_pemerintahan','Kantor Pemerintahan',4],
                ['pasar_sarana_ekonomi','Pasar / Sarana Ekonomi',5],['jembatan_jalan_putus','Jembatan / Jalan Putus',6],
                ['jaringan_listrik_telkom','Jaringan Listrik / Telkom',7],['sarana_air_bersih','Sarana Air Bersih (Pamsimas/Sumur Umum)',8],
                ['lainnya','Yang lain',99,true],
            ],
            'opt_kebutuhan_logistik' => [
                ['bahan_pangan','Bahan Pangan',1],['air_bersih_sanitasi','Air Bersih & Perlengkapan Sanitasi',2],
                ['tenda_terpal_selimut','Tenda / Terpal / Selimut',3],['perlengkapan_bayi','Perlengkapan Bayi',4],
                ['obat_obatan_tim_medis','Obat-obatan & Tim Medis',5],['alat_berat','Alat Berat',6],
                ['perlengkapan_evakuasi','Perlengkapan Evakuasi',7],['lainnya','Yang lain',99,true],
            ],
            'opt_banjir_penyebab' => [
                ['curah_hujan_tinggi','Curah Hujan Tinggi',1],['luapan_sungai','Luapan Sungai',2],
                ['drainase_buruk','Drainase Buruk / Tersumbat',3],['tanggul_jebol','Tanggul Jebol',4],
                ['kiriman_air_hulu','Kiriman Air dari Hulu',5],['lainnya','Yang lain',99,true],
            ],
            'opt_banjir_ketinggian' => [
                ['mata_kaki','Mata Kaki (10 - 30 cm)',1],['lutut','Lutut Orang Dewasa (30 - 60 cm)',2],
                ['pinggang_dada','Pinggang/Dada (60 - 100 cm)',3],['diatas_100','Diatas 100 cm',4],
                ['lainnya','Yang lain',99,true],
            ],
            'opt_banjir_kondisi_air' => [
                ['air_naik','Air Terus Meningkat (Naik)',1],['statis','Bertahan (Statis)',2],['surut','Mulai Surut',3],
            ],
            'opt_bandang_kecepatan_air' => [
                ['sangat_cepat','Sangat Cepat',1],['bertahap','Bertahap',2],
            ],
            'opt_bandang_material_terbawa' => [
                ['lumpur_tebal','Lumpur Tebal',1],['batang_pohon','Batang Pohon / Material Kayu',2],
                ['batu_kerikil','Batu-batuan / Kerikil',3],['sampah_puing','Sampah / Puing Bangunan',4],['lainnya','Yang lain',99,true],
            ],
            'opt_bandang_kondisi_arus' => [
                ['sangat_deras','Arus Sangat Deras',1],['mulai_melambat','Arus Mulai Melambat',2],['sudah_surut','Air Sudah Surut',3],
            ],
            'opt_bandang_kerusakan_infrastruktur' => [
                ['jalan_putus','Jalan Terputus / Amblas',1],['jembatan_rusak','Jembatan Hanyut / Rusak Berat',2],
                ['bangunan_hanyut','Bangunan Hanyut (Rumah/Fasum)',3],['lahan_hancur','Lahan Pertanian Hancur Total',4],['lainnya','Yang lain',99,true],
            ],
            'opt_longsor_penyebab' => [
                ['hujan_lebat','Hujan Lebat',1],['tanah_labil','Labilnya Tanah',2],['kebocoran_pipa','Kebocoran Pipa',3],['lainnya','Yang lain',99,true],
            ],
            'opt_longsor_jenis_lokasi' => [
                ['tebing_jalan','Tebing Jalan (Menutup akses transportasi)',1],
                ['pemukiman','Pemukiman Warga (Mengenai rumah)',2],
                ['lahan_pertanian','Lahan Pertanian / Perkebunan',3],
                ['bantaran_sungai','Bantaran Sungai',4],['lainnya','Yang lain',99,true],
            ],
            'opt_longsor_akses_transportasi' => [
                ['putus_total','Akses Putus Total',1],['roda2','Hanya Bisa Dilalui Kendaraan Roda 2',2],
                ['buka_tutup','Buka Tutup',3],['normal','Normal',4],
            ],
            'opt_longsor_material' => [
                ['tanah','Tanah',1],['batu','Batu',2],['pohon_kayu','Pohon/Kayu',3],['lumpur','Lumpur',4],['lainnya','Yang lain',99,true],
            ],
            'opt_longsor_potensi_susulan' => [
                ['tinggi','Tinggi',1],['sedang','Sedang',2],['rendah','Rendah',3],
            ],
            'opt_cuaca_fenomena' => [
                ['puting_beliung','Angin Puting Beliung',1],['angin_kencang','Angin Kencang',2],
                ['hujan_es','Hujan Es',3],['kilat_petir','Kilat / Petir yang Intens',4],
            ],
            'opt_cuaca_dampak_pohon' => [
                ['tidak_ada','Tidak Ada',1],['halang_jalan','Pohon Tumbang (Menghalangi jalan)',2],
                ['timpa_rumah','Pohon Tumbang (Menimpa rumah/bangunan)',3],['timpa_kabel','Pohon Tumbang (Menimpa kabel listrik/telepon)',4],
            ],
            'opt_cuaca_kerusakan_bangunan' => [
                ['atap_terlepas','Atap Terlepas',1],['tertimpa_pohon','Tertimpa Pohon',2],['dinding_roboh','Dinding Roboh',3],['lainnya','Yang lain',99,true],
            ],
            'opt_kekeringan_sektor' => [
                ['rumah_tangga','Rumah Tangga (Kesulitan air minum/mandi)',1],
                ['pertanian','Pertanian / Perkebunan (Tanaman layu/mati)',2],
                ['peternakan','Peternakan (Kekurangan air untuk hewan ternak)',3],
                ['sanitasi_fasilitas','Sanitasi Fasilitas Umum (Sekolah/Puskesmas/Rumah Ibadah)',4],
            ],
            'opt_kekeringan_kondisi_air' => [
                ['mengering','Mengering Total',1],['debit_menurun','Debit Air Menurun Drastis',2],
                ['masih_mengalir_keruh','Masih Mengalir namun mulai keruh',3],['jarak_jauh','Jarak ke sumber air menjadi sangat jauh (>1km)',4],
            ],
            'opt_kekeringan_durasi' => [
                ['lt_2_minggu','< 2 Minggu',1],['2_4_minggu','2 - 4 Minggu',2],['1_2_bulan','1 - 2 Bulan',3],['gt_2_bulan','> 2 Bulan',4],
            ],
            'opt_kekeringan_potensi_risiko' => [
                ['karhutla','Kerawanan Karhutla',1],['penyakit','Munculnya Penyakit (Diare/Penyakit Kulit)',2],
                ['konflik_sosial','Konflik Sosial (Berebut sumber air)',3],['lainnya','Yang lain',99,true],
            ],
            'opt_kekeringan_upaya_masyarakat' => [
                ['sumur_gali','Membuat sumur gali baru secara mandiri',1],
                ['beli_air','Membeli air bersih dari tangki swasta',2],
                ['ambil_sungai','Mengambil air dari sungai yang masih mengalir',3],['lainnya','Yang lain',99,true],
            ],
            'opt_karhutla_kondisi_api' => [
                ['aktif','Api Masih Berkobar (Aktif)',1],['pendinginan','Api Sudah Padam, Masih Berasap (Pendinginan)',2],['padam','Api Sudah Padam Total',3],
            ],
            'opt_karhutla_jenis_lahan' => [
                ['gambut','Lahan Gambut',1],['mineral','Lahan Mineral / Tanah Keras',2],
                ['perkebunan','Perkebunan Sawit / Karet',3],['hutan','Hutan / Semak Belukar',4],
            ],
            'opt_karhutla_pemilik_lahan' => [
                ['masyarakat','Milik Masyarakat/Perorangan',1],['perusahaan','Milik Perusahaan (HGU)',2],
                ['negara','Lahan Terbuka / Milik Negara',3],['tidak_diketahui','Belum Diketahui',4],
            ],
            'opt_karhutla_jarak_pemukiman' => [
                ['lt_500m','< 500 Meter (Sangat Terancam)',1],['gt_500m','> 500 Meter',2],
            ],
            'opt_karhutla_sumber_air' => [
                ['tersedia','Tersedia di Lokasi (Kanal/Embong/Kolam)',1],
                ['jauh','Jauh dari Lokasi (Perlu selang panjang >200m)',2],
                ['tidak_ada','Tidak Ada Sumber Air (Butuh suplai mobil tangki)',3],
            ],
            'opt_karhutla_akses_lokasi' => [
                ['roda4','Bisa Dilalui Kendaraan Roda 4',1],['roda2','Hanya Bisa Dilalui Kendaraan Roda 2',2],['jalan_kaki','Hanya Bisa Ditempuh dengan Jalan Kaki',3],
            ],
            'opt_wabah_jenis_penyakit' => [
                ['pernapasan','Gejala Saluran Pernapasan (Batuk, Sesak Napas)',1],
                ['pencernaan','Gejala Pencernaan (Diare Massal, Muntah)',2],
                ['kulit','Gejala Kulit (Gatal-gatal, Ruam, Melepuh)',3],
                ['demam','Demam Tinggi Berjamaah (Dugaan DBD/Malaria/Tipus)',4],
                ['keracunan','Keracunan Makanan (Gejala serentak setelah acara tertentu)',5],
                ['lainnya','Yang lain',99,true],
            ],
            'opt_wabah_sebaran' => [
                ['satu_rt','Terfokus di satu RT/RW saja',1],['satu_desa','Tersebar di satu Desa/Kelurahan',2],
                ['lintas_kecamatan','Lintas Kecamatan',3],['lokasi_khusus','Lokasi Khusus (Sekolah, Pondok Pesantren, Perkantoran)',4],
                ['lainnya','Yang lain',99,true],
            ],
            'opt_wabah_fasilitas_kesehatan' => [
                ['puskesmas','Puskesmas',1],['bidan_desa','Bidan Desa / Mantri',2],
                ['rsud','Rumah Sakit Umum Daerah (RSUD)',3],['belum_ada','Belum ada penanganan medis',4],
            ],
            'opt_wabah_kondisi_sanitasi' => [
                ['layak','Layak / Bersih',1],['tercemar','Tercemar (Dugaan sumber penularan)',2],
                ['buruk','Sanitasi Buruk (Drainase mampet/Sampah menumpuk)',3],
            ],
            'opt_gempa_durasi' => [
                ['singkat','Singkat (< 5 Detik)',1],['sedang','Sedang (5 - 15 Detik)',2],['lama','Lama (> 15 Detik)',3],
            ],
            'opt_gempa_kekuatan' => [
                ['lemah','Lemah',1],['kuat','Kuat',2],['sangat_kuat','Sangat Kuat',3],
            ],
            'opt_gempa_dampak_struktural' => [
                ['retak_rambut','Retak Rambut',1],['retak_struktur','Retak Struktur',2],
                ['atap_runtuh','Atap/Plafon Runtuh',3],['roboh_sebagian','Bangunan Roboh Sebagian',4],['roboh_total','Bangunan Roboh Total',5],
            ],
            'opt_gempa_kerusakan_jalan' => [
                ['rekahan','Terdapat Rekahan Tanah',1],['amblas','Jalan Amblas / Bergelombang',2],
                ['pagar_roboh','Pagar / Tembok Pembatas Roboh',3],['lainnya','Yang lain',99,true],
            ],
            'opt_gempa_potensi_susulan' => [
                ['longsor','Teramati Lereng/Tebing tidak stabil (Potensi Longsor)',1],
                ['kebocoran_gas','Terdapat kebocoran pipa gas atau korsleting listrik masif',2],
                ['tidak_ada','Tidak ada ancaman terlihat',3],
            ],
            'opt_gempa_kondisi_warga' => [
                ['tenang','Tenang / Tetap di dalam rumah',1],['panik','Panik / Keluar rumah ke lapangan terbuka',2],
                ['titik_kumpul','Berada di titik kumpul/tenda darurat',3],
            ],
            'opt_konflik_sifat' => [
                ['bentrokan','Bentrokan Fisik (Antar kelompok/warga)',1],['demonstrasi','Demonstrasi / Unjuk Rasa Masif',2],
                ['penutupan','Penutupan / Pemblokiran Akses (Jalan/Lahan)',3],
                ['intimidasi','Intimidasi / Ketegangan Tanpa Kekerasan Fisik',4],['perusakan','Perusakan Properti / Fasilitas',5],
                ['lainnya','Yang lain',99,true],
            ],
            'opt_konflik_aktor' => [
                ['antar_warga','Antar Warga / Kelompok Masyarakat',1],
                ['warga_perusahaan','Warga dengan Perusahaan (HGU/Konflik Lahan)',2],
                ['warga_pemerintah','Warga dengan Instansi Pemerintah',3],
                ['antar_ormas','Antar Organisasi Kemasyarakatan (Ormas)',4],
                ['lainnya','Yang lain',99,true],
            ],
            'opt_konflik_pemicu' => [
                ['sengketa_lahan','Masalah Sengketa Lahan',1],['isu_sara','Isu SARA (Suku, Agama, Ras, Antargolongan)',2],
                ['dampak_lingkungan','Dampak Lingkungan (Limbah/Polusi)',3],['kesenjangan_sosial','Kesenjangan Sosial / Masalah Ketenagakerjaan',4],
                ['lainnya','Yang lain',99,true],
            ],
            'opt_konflik_jumlah_terlibat' => [
                ['kecil','Kelompok Kecil (< 20 Orang)',1],['sedang','Kelompok Sedang (20 - 100 Orang)',2],['besar','Kelompok Besar / Massa (> 100 Orang)',3],
            ],
            'opt_konflik_kerusakan_materil' => [
                ['kendaraan','Kendaraan Terbakar / Rusak',1],['rumah_rusak','Rumah / Bangunan Rusak',2],
                ['fasum_dirusak','Fasilitas Umum Dirusak',3],['tidak_ada','Tidak Ada Kerusakan Materil',4],
            ],
            'opt_konflik_aparat' => [
                ['belum_ada','Belum Ada Aparat',1],['kepolisian','Sudah Ada Personel Kepolisian (Polres/Polsek)',2],
                ['tni','Sudah Ada Personel TNI',3],['satpol_pp','Sudah Ada Personel Satpol PP',4],['lainnya','Yang lain',99,true],
            ],
        ];

        foreach ($opts as $table => $rows) {
            foreach ($rows as $row) {
                DB::table($table)->upsert([
                    'kode' => $row[0],
                    'label' => $row[1],
                    'urutan' => $row[2],
                    'is_other' => $row[3] ?? false,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], ['kode'], ['label','urutan','is_other']);
            }
        }
        
        $this->command->info('Reference options seeded successfully.');
    }
}
