<?php
namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;

class OptionsController extends Controller
{
    public function getOptions(string $jenis)
    {
        $map = [
            'banjir' => [
                'opt_banjir_penyebab',
                'opt_banjir_ketinggian',
                'opt_banjir_kondisi_air',
                'opt_kondisi_cuaca',
            ],
            'banjir_bandang' => [
                'opt_kondisi_cuaca',
                'opt_bandang_kecepatan_air',
                'opt_bandang_kondisi_arus',
                'opt_bandang_material_terbawa',
                'opt_bandang_kerusakan_infrastruktur',
            ],
            'tanah_longsor' => [
                'opt_kondisi_cuaca',
                'opt_longsor_penyebab',
                'opt_longsor_jenis_lokasi',
                'opt_longsor_akses_transportasi',
                'opt_longsor_material',
                'opt_longsor_potensi_susulan',
            ],
            'cuaca_ekstrim' => [
                'opt_kondisi_cuaca',
                'opt_cuaca_fenomena',
                'opt_cuaca_dampak_pohon',
                'opt_cuaca_kerusakan_bangunan',
            ],
            'kekeringan' => [
                'opt_kekeringan_sektor',
                'opt_kekeringan_kondisi_air',
                'opt_kekeringan_durasi',
                'opt_kekeringan_potensi_risiko',
                'opt_kekeringan_upaya_masyarakat',
            ],
            'karhutla' => [
                'opt_karhutla_kondisi_api',
                'opt_karhutla_jenis_lahan',
                'opt_karhutla_pemilik_lahan',
                'opt_karhutla_jarak_pemukiman',
                'opt_karhutla_sumber_air',
                'opt_karhutla_akses_lokasi',
            ],
            'wabah' => [
                'opt_wabah_jenis_penyakit',
                'opt_wabah_sebaran',
                'opt_wabah_fasilitas_kesehatan',
                'opt_wabah_kondisi_sanitasi',
            ],
            'gempa_bumi' => [
                'opt_gempa_durasi',
                'opt_gempa_kekuatan',
                'opt_gempa_dampak_struktural',
                'opt_gempa_kerusakan_jalan',
                'opt_gempa_potensi_susulan',
                'opt_gempa_kondisi_warga',
            ],
            'konflik_sosial' => [
                'opt_konflik_sifat',
                'opt_konflik_aktor',
                'opt_konflik_pemicu',
                'opt_konflik_jumlah_terlibat',
                'opt_konflik_kerusakan_materil',
                'opt_konflik_aparat',
            ],
        ];

        if (!isset($map[$jenis])) {
            return response()->json(['error' => 'Jenis bencana tidak dikenali'], 404);
        }

        $result = [];
        foreach ($map[$jenis] as $table) {
            $result[$table] = DB::table($table)
                ->where('is_active', true)
                ->orderBy('urutan')
                ->get(['id', 'kode', 'label', 'is_other']);
        }

        return response()->json($result);
    }
}
