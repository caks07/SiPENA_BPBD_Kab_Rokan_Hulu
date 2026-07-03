<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = DB::table('laporan_bencana as l')
            ->join('kecamatan as k', 'l.kecamatan_id', '=', 'k.id')
            ->whereNull('l.deleted_at')
            ->select('l.id','l.jenis_bencana','l.nama_pelapor','l.waktu_kejadian',
                     'l.status','l.severity_level','l.latitude','l.longitude',
                     'l.lokasi_text','l.created_at','k.nama_kecamatan');
        if ($user->role->nama_role === 'operator' && $user->kecamatan_id) {
            $query->where('l.kecamatan_id', $user->kecamatan_id);
        }
        return response()->json($query->orderBy('l.created_at','desc')->limit(100)->get());
    }

    public function map(Request $request)
    {
        $rows = DB::select("
            SELECT l.id, l.jenis_bencana, l.status, l.severity_level,
                   l.latitude, l.longitude, l.waktu_kejadian, l.created_at,
                   k.nama_kecamatan, k.id as kecamatan_id,
                   kb.korban_meninggal, kb.jiwa_mengungsi, kb.korban_luka_berat,
                   kr.rumah_rusak_berat
            FROM laporan_bencana l
            LEFT JOIN kecamatan k ON l.kecamatan_id = k.id
            LEFT JOIN korban_bencana kb ON kb.laporan_id = l.id
            LEFT JOIN kerusakan_bencana kr ON kr.laporan_id = l.id
            WHERE l.deleted_at IS NULL
            ORDER BY l.waktu_kejadian DESC
            LIMIT 500
        ");
        return response()->json($rows);
    }

    public function statistik(Request $request)
    {
        $user = $request->user();
        $base = DB::table('laporan_bencana')->whereNull('deleted_at');
        if ($user->role->nama_role === 'operator' && $user->kecamatan_id) {
            $base->where('kecamatan_id', $user->kecamatan_id);
        }
        return response()->json([
            'total'   => (clone $base)->count(),
            'siaga1'  => (clone $base)->where('status','siaga1')->count(),
            'siaga2'  => (clone $base)->where('status','siaga2')->count(),
            'siaga3'  => (clone $base)->where('status','siaga3')->count(),
            'selesai' => (clone $base)->where('status','selesai')->count(),
            'per_jenis' => (clone $base)
                ->select('jenis_bencana', DB::raw('count(*) as total'))
                ->groupBy('jenis_bencana')->get(),
            'korban' => DB::table('korban_bencana')
                ->join('laporan_bencana','korban_bencana.laporan_id','=','laporan_bencana.id')
                ->whereNull('laporan_bencana.deleted_at')
                ->when($user->role->nama_role === 'operator' && $user->kecamatan_id,
                    fn($q) => $q->where('laporan_bencana.kecamatan_id', $user->kecamatan_id))
                ->select(DB::raw('
                    COALESCE(sum(korban_meninggal),0) as meninggal,
                    COALESCE(sum(jiwa_mengungsi),0)   as mengungsi,
                    COALESCE(sum(korban_luka_ringan),0) as luka_ringan,
                    COALESCE(sum(korban_luka_berat),0)  as luka_berat
                '))->first(),
        ]);
    }

    public function rekapKabupaten(Request $request)
    {
        $rows = DB::select("
            SELECT k.nama_kecamatan, l.jenis_bencana,
                   COUNT(l.id) as jumlah_kejadian,
                   COALESCE(SUM(kb.korban_meninggal),0)  as total_meninggal,
                   COALESCE(SUM(kb.jiwa_mengungsi),0)    as total_mengungsi,
                   COALESCE(SUM(kr.rumah_rusak_berat),0) as total_rusak_berat
            FROM laporan_bencana l
            JOIN kecamatan k ON l.kecamatan_id = k.id
            LEFT JOIN korban_bencana kb  ON kb.laporan_id = l.id
            LEFT JOIN kerusakan_bencana kr ON kr.laporan_id = l.id
            WHERE l.deleted_at IS NULL
            GROUP BY k.nama_kecamatan, l.jenis_bencana
            ORDER BY k.nama_kecamatan, l.jenis_bencana
        ");
        return response()->json($rows);
    }

    public function rekapKecamatan(Request $request)
    {
        $user  = $request->user();
        $kecId = $user->kecamatan_id;
        $trash = $request->query('trash') === 'true';
        $rows  = DB::table('laporan_bencana as l')
            ->join('kecamatan as k', 'l.kecamatan_id', '=', 'k.id')
            ->leftJoin('korban_bencana as kb',   'kb.laporan_id',  '=', 'l.id')
            ->leftJoin('kerusakan_bencana as kr', 'kr.laporan_id', '=', 'l.id')
            ->select('l.*', 'k.nama_kecamatan',
                DB::raw('COALESCE(kb.korban_meninggal,0)   as korban_meninggal'),
                DB::raw('COALESCE(kb.korban_luka_ringan,0) as korban_luka_ringan'),
                DB::raw('COALESCE(kb.korban_luka_berat,0)  as korban_luka_berat'),
                DB::raw('COALESCE(kb.jiwa_mengungsi,0)     as jiwa_mengungsi'))
            ->when($kecId, fn($q) => $q->where('l.kecamatan_id', $kecId))
            ->when($trash, fn($q) => $q->whereNotNull('l.deleted_at'), fn($q) => $q->whereNull('l.deleted_at'))
            ->orderBy('l.created_at', 'desc')
            ->get();
        return response()->json($rows);
    }

    public function infografis(Request $request)
    {
        return response()->json([
            'per_bulan' => DB::select("
                SELECT TO_CHAR(waktu_kejadian,'YYYY-MM') as bulan,
                       jenis_bencana, COUNT(*) as total
                FROM laporan_bencana WHERE deleted_at IS NULL
                GROUP BY bulan, jenis_bencana ORDER BY bulan
            "),
            'per_kecamatan' => DB::select("
                SELECT k.nama_kecamatan, COUNT(l.id) as total
                FROM laporan_bencana l
                JOIN kecamatan k ON l.kecamatan_id = k.id
                WHERE l.deleted_at IS NULL GROUP BY k.nama_kecamatan
                ORDER BY total DESC
            "),
            'per_siaga' => DB::table('laporan_bencana')
                ->whereNull('deleted_at')
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')->get(),
            'kerusakan' => DB::table('kerusakan_bencana as kr')
                ->join('laporan_bencana as l', 'l.id', '=', 'kr.laporan_id')
                ->whereNull('l.deleted_at')
                ->selectRaw('
                    COALESCE(SUM(kr.rumah_rusak_berat),0)   as rumah_rusak_berat,
                    COALESCE(SUM(kr.rumah_rusak_sedang),0)  as rumah_rusak_sedang,
                    COALESCE(SUM(kr.rumah_rusak_ringan),0)  as rumah_rusak_ringan
                ')->first(),
        ]);
    }
}
