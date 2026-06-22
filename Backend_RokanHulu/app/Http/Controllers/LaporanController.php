<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LaporanController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = DB::table('laporan_bencana as l')
            ->whereNull('l.deleted_at')
            ->join('kecamatan as k', 'l.kecamatan_id', '=', 'k.id')
            ->leftJoin('korban_bencana as kb', 'kb.laporan_id', '=', 'l.id')
            ->leftJoin('kerusakan_bencana as krb', 'krb.laporan_id', '=', 'l.id')
            ->select(
                'l.*', 'k.nama_kecamatan',
                'kb.korban_meninggal', 'kb.korban_luka_berat',
                'kb.korban_luka_ringan', 'kb.jiwa_mengungsi',
                'kb.korban_hilang', 'kb.kk_mengungsi',
                'krb.rumah_rusak_berat', 'krb.rumah_rusak_sedang', 'krb.rumah_rusak_ringan'
            );

        if ($user && $user->role->nama_role === 'operator' && $user->kecamatan_id) {
            $query->where('l.kecamatan_id', $user->kecamatan_id);
        }
        
        $laporans = $query->orderBy('l.created_at', 'desc')->get();
        
        $laporanIds = $laporans->pluck('id')->toArray();
        if (!empty($laporanIds)) {
            $fasilitasRaw = DB::table('kerusakan_fasilitas_umum as kfu')
                ->join('opt_fasilitas_umum as fu', 'fu.id', '=', 'kfu.fasilitas_umum_id')
                ->whereIn('kfu.laporan_id', $laporanIds)
                ->select('kfu.laporan_id', 'fu.label')
                ->get();
            
            $fasilitasMap = [];
            foreach ($fasilitasRaw as $f) {
                $fasilitasMap[$f->laporan_id][] = $f->label;
            }
            
            foreach ($laporans as $l) {
                $l->fasilitas_terdampak = $fasilitasMap[$l->id] ?? [];
            }
        }

        return response()->json($laporans);
    }


    public function show(Request $request, $id)
    {
        $user = $request->user();
        $laporan = DB::table('laporan_bencana as l')
            ->join('kecamatan as k', 'l.kecamatan_id', '=', 'k.id')
            ->select('l.*', 'k.nama_kecamatan')
            ->where('l.id', $id)->first();

        if (!$laporan) return response()->json(['error' => 'Not Found'], 404);

        if ($user && $user->role->nama_role === 'operator' && $laporan->kecamatan_id != $user->kecamatan_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $laporan->korban    = DB::table('korban_bencana')->where('laporan_id', $id)->first();
        $laporan->kerusakan = DB::table('kerusakan_bencana')->where('laporan_id', $id)->first();
        $laporan->fotos     = DB::table('laporan_foto')->where('laporan_id', $id)->get();
        $laporan->logs      = DB::table('laporan_log')
            ->leftJoin('users', 'laporan_log.user_id', '=', 'users.id')
            ->where('laporan_log.laporan_id', $id)
            ->select('laporan_log.*', 'users.name as user_name')
            ->orderBy('laporan_log.created_at', 'desc')
            ->get()
            ->map(function ($log) {
                if ($log->user_name) {
                    $log->user = ['name' => $log->user_name];
                }
                return $log;
            });

        // Fasilitas umum terdampak (pivot: kerusakan_fasilitas_umum → opt_fasilitas_umum)
        try {
            $laporan->fasilitas_terdampak = DB::table('kerusakan_fasilitas_umum as kfu')
                ->join('opt_fasilitas_umum as fu', 'fu.id', '=', 'kfu.fasilitas_umum_id')
                ->where('kfu.laporan_id', $id)
                ->pluck('fu.label');
        } catch (\Exception $e) {
            $laporan->fasilitas_terdampak = [];
        }

        // Kebutuhan logistik (pivot: kerusakan_kebutuhan_logistik → opt_kebutuhan_logistik)
        try {
            $laporan->kebutuhan_logistik = DB::table('kerusakan_kebutuhan_logistik as kkl')
                ->join('opt_kebutuhan_logistik as kl', 'kl.id', '=', 'kkl.kebutuhan_logistik_id')
                ->where('kkl.laporan_id', $id)
                ->pluck('kl.label');
        } catch (\Exception $e) {
            $laporan->kebutuhan_logistik = [];
        }

        $detailTable = $this->getDetailTable($laporan->jenis_bencana);
        if ($detailTable) {
            try {
                $raw = DB::table($detailTable)->where('laporan_id', $id)->first();
                $laporan->detail_raw    = $raw;
                $laporan->detail        = $raw;
            } catch (\Exception $e) {}
        }
        return response()->json($laporan);
    }


    public function store(Request $request)
    {
        // ── [1] Verifikasi Form Access Token ─────────────────────────────────────
        // Token dikeluarkan oleh POST /api/form-access/verify setelah password benar.
        // Cek di sini (awal), tapi HAPUS hanya setelah laporan berhasil tersimpan.
        // Jika validasi/DB gagal → token tetap valid agar user tidak re-enter password.
        $formToken = $request->header('X-Form-Access-Token');
        if (!$formToken || !Cache::has("form_access:{$formToken}")) {
            return response()->json([
                'error' => 'Akses form tidak valid atau sudah kedaluwarsa. Muat ulang halaman dan masukkan password kembali.',
            ], 401);
        }

        try {
            DB::beginTransaction();

            $user   = $request->user('sanctum');
            $sumber = 'trc';
            if ($user?->role) {
                if ($user->role->nama_role === 'operator') $sumber = 'kecamatan';
                if (in_array($user->role->nama_role, ['admin', 'pimpinan'])) $sumber = 'admin';
            }

            $laporanData   = json_decode($request->input('laporan'), true);
            $korbanData    = json_decode($request->input('korban'), true);
            $kerusakanData = json_decode($request->input('kerusakan'), true);
            $detailData    = json_decode($request->input('detail_bencana'), true);
            $fasilitasIds  = json_decode($request->input('fasilitas_ids', '[]'), true);
            $logistikIds   = json_decode($request->input('logistik_ids', '[]'), true);

            if (!$laporanData) {
                return response()->json(['error' => 'Payload laporan tidak valid atau kosong'], 400);
            }

            // ── [2] Validasi waktu kejadian tidak boleh masa depan ───────────────
            if (!empty($laporanData['waktu_kejadian'])) {
                $wkt = Carbon::parse($laporanData['waktu_kejadian'], 'Asia/Jakarta');
                if ($wkt->isFuture()) {
                    return response()->json([
                        'error' => 'Tanggal dan jam kejadian tidak boleh melebihi waktu sekarang.',
                    ], 422);
                }
            }

            // ── [3] Validasi koordinat (required) ────────────────────────────────
            $lat = (float) ($laporanData['latitude']  ?? 0);
            $lng = (float) ($laporanData['longitude'] ?? 0);
            if ($lat === 0.0 && $lng === 0.0) {
                return response()->json(['error' => 'Koordinat lokasi kejadian wajib diisi.'], 422);
            }

            // ── [4] Validasi file dokumentasi (media) ───────────────────────────
            if ($request->hasFile('fotos')) {
                $uploadedFiles = $request->file('fotos');
                if (count($uploadedFiles) > 5) {
                    return response()->json([
                        'error' => 'Maksimal 5 file bukti yang dapat diunggah.'
                    ], 422);
                }

                $allowedExtensions = ['jpg', 'jpeg', 'png', 'mp4', 'mov', '3gp'];

                foreach ($uploadedFiles as $foto) {
                    $ext = strtolower($foto->getClientOriginalExtension());
                    if (!in_array($ext, $allowedExtensions)) {
                        return response()->json([
                            'error' => 'Format file ' . $foto->getClientOriginalName() . ' tidak didukung.'
                        ], 422);
                    }

                    if ($foto->getSize() > 100 * 1024 * 1024) {
                        $mime = $foto->getMimeType();
                        if (str_starts_with($mime, 'video/')) {
                            return response()->json([
                                'error' => 'Ukuran file ' . $foto->getClientOriginalName() . ' melebihi 100 MB atau durasi video terlalu panjang.'
                            ], 422);
                        } else {
                            return response()->json([
                                'error' => 'Ukuran file ' . $foto->getClientOriginalName() . ' melebihi 100 MB.'
                            ], 422);
                        }
                    }
                }
            }


            // ── Insert laporan utama ───────────────────────────────────────────────
            $laporanId = DB::table('laporan_bencana')->insertGetId([
                'jenis_bencana'      => $laporanData['jenis_bencana'],
                'nama_pelapor'       => $laporanData['nama_pelapor'],
                'sumber_laporan'     => $sumber,
                'created_by_user_id' => $user?->id,
                'kecamatan_id'       => $laporanData['kecamatan_id'],
                'lokasi_text'        => $laporanData['lokasi_text'],
                'latitude'           => $lat,
                'longitude'          => $lng,
                'location_geom'      => DB::raw("ST_SetSRID(ST_MakePoint($lng, $lat), 4326)"),
                'sumber_koordinat'   => 'titik_peta',
                'waktu_kejadian'     => $laporanData['waktu_kejadian'],
                'status'             => $laporanData['status'] ?? 'siaga1',
                'severity_level'     => (int) ($laporanData['severity_level'] ?? 1),
                'is_baru'            => true,
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);

            // ── Korban ─────────────────────────────────────────────────────────────
            if ($korbanData) {
                $allowed = ['korban_luka_ringan','korban_luka_berat','korban_meninggal',
                            'korban_hilang','kk_mengungsi','jiwa_mengungsi'];
                DB::table('korban_bencana')->insert(array_merge(
                    ['laporan_id' => $laporanId, 'created_at' => now(), 'updated_at' => now()],
                    array_intersect_key($korbanData, array_flip($allowed))
                ));
            }

            // ── Kerusakan ──────────────────────────────────────────────────────────
            if ($kerusakanData) {
                $allowed = ['rumah_rusak_ringan','rumah_rusak_sedang','rumah_rusak_berat',
                            'catatan_fasilitas_umum','catatan_lain'];
                DB::table('kerusakan_bencana')->insert(array_merge(
                    ['laporan_id' => $laporanId, 'created_at' => now(), 'updated_at' => now()],
                    array_intersect_key($kerusakanData, array_flip($allowed))
                ));
            }

            // ── Pivot fasilitas & logistik ─────────────────────────────────────────
            // PostgreSQL: FK violation aborts the current transaction block.
            // Gunakan SAVEPOINT per-item agar rollback hanya ke savepoint jika FK gagal,
            // bukan ke seluruh transaksi laporan utama.
            foreach ((array) $fasilitasIds as $i => $fid) {
                try {
                    DB::statement("SAVEPOINT sp_fasilitas_{$i}");
                    DB::table('kerusakan_fasilitas_umum')->insert([
                        'laporan_id' => $laporanId, 'fasilitas_umum_id' => (int) $fid, 'created_at' => now(),
                    ]);
                    DB::statement("RELEASE SAVEPOINT sp_fasilitas_{$i}");
                } catch (\Exception $e) {
                    DB::statement("ROLLBACK TO SAVEPOINT sp_fasilitas_{$i}");
                    Log::info("Skip fasilitas_id={$fid}: " . $e->getMessage());
                }
            }
            foreach ((array) $logistikIds as $i => $lid) {
                try {
                    DB::statement("SAVEPOINT sp_logistik_{$i}");
                    DB::table('kerusakan_kebutuhan_logistik')->insert([
                        'laporan_id' => $laporanId, 'kebutuhan_logistik_id' => (int) $lid, 'created_at' => now(),
                    ]);
                    DB::statement("RELEASE SAVEPOINT sp_logistik_{$i}");
                } catch (\Exception $e) {
                    DB::statement("ROLLBACK TO SAVEPOINT sp_logistik_{$i}");
                    Log::info("Skip logistik_id={$lid}: " . $e->getMessage());
                }
            }

            // ── Detail per jenis bencana ───────────────────────────────────────────
            // FIX: Field _ids[] bertipe int[] di PostgreSQL TIDAK bisa diinsert sebagai array PHP biasa.
            // Laravel QueryBuilder memanggil ksort() pada value array → TypeError.
            // Solusi: konversi ke DB::raw("'{1,2,3}'") sebelum insert.
            if ($detailData && !empty($laporanData['jenis_bencana'])) {
                $table = $this->getDetailTable($laporanData['jenis_bencana']);
                if ($table) {
                    $sanitized = $this->sanitizeDetailForPostgres($detailData);
                    DB::table($table)->insert(array_merge($sanitized, [
                        'laporan_id' => $laporanId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]));
                }
            }

            // ── Upload foto (opsional) ────────────────────────────────────────────
            if ($request->hasFile('fotos')) {
                foreach ($request->file('fotos') as $i => $foto) {
                    $path = $foto->store('laporan_fotos', 'public');
                    DB::table('laporan_foto')->insert([
                        'laporan_id' => $laporanId,
                        'file_path'  => '/storage/' . $path,
                        'file_name'  => $foto->getClientOriginalName(),
                        'mime_type'  => $foto->getMimeType(),
                        'file_size'  => $foto->getSize(),
                        'sort_order' => $i + 1,
                        'created_at' => now(),
                    ]);
                }
            }

            DB::commit();

            // ── [5] Hapus form access token setelah laporan sukses tersimpan ─────
            // Token dihapus di sini (bukan di awal) agar user bisa retry tanpa re-enter password
            Cache::forget("form_access:{$formToken}");

            return response()->json(['message' => 'Laporan berhasil disubmit', 'id' => $laporanId], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('store laporan error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            
            $errorMessage = config('app.debug') 
                ? $e->getMessage() 
                : 'Gagal mengirim laporan. Silakan periksa kembali data Anda.';
                
            return response()->json(['error' => $errorMessage], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user    = $request->user();
        $laporan = DB::table('laporan_bencana')->where('id', $id)->first();
        if (!$laporan) return response()->json(['error' => 'Not Found'], 404);
        if ($user->role->nama_role === 'pimpinan') return response()->json(['error' => 'Read only'], 403);
        if ($user->role->nama_role === 'operator' && $laporan->kecamatan_id != $user->kecamatan_id)
            return response()->json(['error' => 'Unauthorized'], 403);

        // Decode fields if sent as multipart/form-data
        $korbanInput = $request->input('korban');
        if (is_string($korbanInput)) $korbanInput = json_decode($korbanInput, true);

        $kerusakanInput = $request->input('kerusakan');
        if (is_string($kerusakanInput)) $kerusakanInput = json_decode($kerusakanInput, true);

        $fasilitasInput = $request->input('fasilitas_terdampak');
        if (is_string($fasilitasInput)) $fasilitasInput = json_decode($fasilitasInput, true);

        $logistikInput = $request->input('kebutuhan_logistik');
        if (is_string($logistikInput)) $logistikInput = json_decode($logistikInput, true);

        $detailInput = $request->input('detail_bencana');
        if (is_string($detailInput)) $detailInput = json_decode($detailInput, true);

        $auditInput = $request->input('audit_log');
        if (is_string($auditInput)) $auditInput = json_decode($auditInput, true);

        DB::beginTransaction();
        try {
            $update = ['updated_at' => now(), 'is_baru' => false];

            // ── Status / severity update (from EditPage/quick status) ──
            if ($request->has('status')) {
                $update['status'] = $request->status;
                $update['severity_level'] = match($request->status) {
                    'siaga1'  => 1,
                    'siaga2'  => 2,
                    'siaga3'  => 3,
                    'selesai' => 0,
                    default   => 3,
                };
            }
            if ($request->has('severity_level')) {
                $update['severity_level'] = (int) $request->severity_level;
            }
            if ($request->has('catatan_update')) {
                $update['catatan_update'] = $request->catatan_update;
            }

            // ── Full detail update (from EditDetailPage) ──
            foreach (['nama_pelapor','kecamatan_id','lokasi_text','waktu_kejadian'] as $field) {
                if ($request->has($field)) $update[$field] = $request->$field;
            }
            if ($request->has('latitude') && $request->has('longitude')) {
                $lat = (float) $request->latitude;
                $lng = (float) $request->longitude;
                $update['latitude']      = $lat;
                $update['longitude']     = $lng;
                $update['location_geom'] = DB::raw("ST_SetSRID(ST_MakePoint($lng, $lat), 4326)");
            }

            DB::table('laporan_bencana')->where('id', $id)->update($update);

            // ── Korban update ──
            if ($korbanInput !== null) {
                $allowed = ['korban_luka_ringan','korban_luka_berat','korban_meninggal',
                            'korban_hilang','kk_mengungsi','jiwa_mengungsi'];
                $filtered = array_intersect_key((array)$korbanInput, array_flip($allowed));
                $exists = DB::table('korban_bencana')->where('laporan_id', $id)->exists();
                if ($exists) {
                    DB::table('korban_bencana')->where('laporan_id', $id)
                        ->update(array_merge($filtered, ['updated_at' => now()]));
                } else {
                    DB::table('korban_bencana')->insert(array_merge(
                        $filtered, ['laporan_id' => $id, 'created_at' => now(), 'updated_at' => now()]
                    ));
                }
            }

            // ── Kerusakan update ──
            if ($kerusakanInput !== null) {
                $allowed   = ['rumah_rusak_ringan','rumah_rusak_sedang','rumah_rusak_berat',
                              'catatan_fasilitas_umum','catatan_lain'];
                $filtered  = array_intersect_key((array)$kerusakanInput, array_flip($allowed));
                $exists = DB::table('kerusakan_bencana')->where('laporan_id', $id)->exists();
                if ($exists) {
                    DB::table('kerusakan_bencana')->where('laporan_id', $id)
                        ->update(array_merge($filtered, ['updated_at' => now()]));
                } else {
                    DB::table('kerusakan_bencana')->insert(array_merge(
                        $filtered, ['laporan_id' => $id, 'created_at' => now(), 'updated_at' => now()]
                    ));
                }
            }

            // ── Fasilitas Umum Terdampak & Kebutuhan Logistik (Pivot) ──
            if ($fasilitasInput !== null) {
                DB::table('kerusakan_fasilitas_umum')->where('laporan_id', $id)->delete();
                $fIds = $fasilitasInput;
                if (!empty($fIds)) {
                    $insertData = array_map(fn($fId) => ['laporan_id' => $id, 'fasilitas_umum_id' => $fId, 'created_at' => now()], (array)$fIds);
                    DB::table('kerusakan_fasilitas_umum')->insert($insertData);
                }
            }
            if ($logistikInput !== null) {
                DB::table('kerusakan_kebutuhan_logistik')->where('laporan_id', $id)->delete();
                $lIds = $logistikInput;
                if (!empty($lIds)) {
                    $insertData = array_map(fn($lId) => ['laporan_id' => $id, 'kebutuhan_logistik_id' => $lId, 'created_at' => now()], (array)$lIds);
                    DB::table('kerusakan_kebutuhan_logistik')->insert($insertData);
                }
            }

            // ── Detail bencana spesifik update ──
            if ($detailInput !== null) {
                $detailData = (array) $detailInput;
                $table = $this->getDetailTable($laporan->jenis_bencana);
                if ($table && !empty($detailData)) {
                    $sanitized = $this->sanitizeDetailForPostgres($detailData);
                    $exists = DB::table($table)->where('laporan_id', $id)->exists();
                    if ($exists) {
                        DB::table($table)->where('laporan_id', $id)
                            ->update(array_merge($sanitized, ['updated_at' => now()]));
                    } else {
                        DB::table($table)->insert(array_merge(
                            $sanitized, ['laporan_id' => $id, 'created_at' => now(), 'updated_at' => now()]
                        ));
                    }
                }
            }

            // ── Media update (Hapus / Tambah) ──
            if ($request->has('deleted_foto_ids')) {
                $delIds = $request->input('deleted_foto_ids');
                if (is_string($delIds)) {
                    $delIds = json_decode($delIds, true);
                }
                if (!empty($delIds)) {
                    $fotosToDelete = DB::table('laporan_foto')
                        ->where('laporan_id', $id)
                        ->whereIn('id', $delIds)
                        ->get();
                    foreach ($fotosToDelete as $f) {
                        $relativePath = str_replace('/storage/', '', $f->file_path);
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($relativePath);
                    }
                    DB::table('laporan_foto')
                        ->where('laporan_id', $id)
                        ->whereIn('id', $delIds)
                        ->delete();
                }
            }

            if ($request->hasFile('fotos')) {
                $uploadedFiles = $request->file('fotos');
                $existingCount = DB::table('laporan_foto')->where('laporan_id', $id)->count();
                if ($existingCount + count($uploadedFiles) > 5) {
                    return response()->json([
                        'error' => 'Total media setelah diupdate tidak boleh melebihi 5 file.'
                    ], 422);
                }

                $allowedExtensions = ['jpg', 'jpeg', 'png', 'mp4', 'mov', '3gp'];
                foreach ($uploadedFiles as $foto) {
                    $ext = strtolower($foto->getClientOriginalExtension());
                    if (!in_array($ext, $allowedExtensions)) {
                        return response()->json([
                            'error' => 'Format file ' . $foto->getClientOriginalName() . ' tidak didukung.'
                        ], 422);
                    }
                    if ($foto->getSize() > 100 * 1024 * 1024) {
                        return response()->json([
                            'error' => 'Ukuran file ' . $foto->getClientOriginalName() . ' melebihi 100 MB.'
                        ], 422);
                    }
                }

                foreach ($uploadedFiles as $i => $foto) {
                    $path = $foto->store('laporan_fotos', 'public');
                    $maxSort = DB::table('laporan_foto')->where('laporan_id', $id)->max('sort_order') ?? 0;
                    DB::table('laporan_foto')->insert([
                        'laporan_id' => $id,
                        'file_path'  => '/storage/' . $path,
                        'file_name'  => $foto->getClientOriginalName(),
                        'mime_type'  => $foto->getMimeType(),
                        'file_size'  => $foto->getSize(),
                        'sort_order' => $maxSort + 1,
                        'created_at' => now(),
                    ]);
                }
            }

            // ── Catat log ──
            if ($auditInput !== null) {
                $audit = $auditInput;
                DB::table('laporan_log')->insert([
                    'laporan_id'    => $id,
                    'user_id'       => $user->id,
                    'aksi'          => $audit['action_type'] ?? 'update_detail',
                    'field_changed' => json_encode($audit['field_changed'] ?? []),
                    'old_value'     => json_encode($audit['old_value'] ?? []),
                    'new_value'     => json_encode($audit['new_value'] ?? []),
                    'catatan'       => $audit['catatan'] ?? 'Detail kejadian diperbarui oleh ' . $user->name,
                    'created_at'    => now(),
                ]);
            } elseif ($request->has('status')) {
                DB::table('laporan_log')->insert([
                    'laporan_id'    => $id,
                    'user_id'       => $user->id,
                    'aksi'          => 'update_status',
                    'field_changed' => json_encode(['status']),
                    'old_value'     => json_encode(['status' => $laporan->status]),
                    'new_value'     => json_encode(['status' => $request->status]),
                    'catatan'       => 'Mengubah status dari ' . strtoupper(str_replace('siaga', 'SIAGA ', $laporan->status)) . ' ke ' . strtoupper(str_replace('siaga', 'SIAGA ', $request->status)) . ($request->catatan_update ? '. Catatan: ' . $request->catatan_update : ''),
                    'created_at'    => now(),
                ]);
            } else {
                DB::table('laporan_log')->insert([
                    'laporan_id' => $id,
                    'user_id'    => $user->id,
                    'aksi'       => 'update_detail',
                    'catatan'    => 'Detail kejadian diperbarui oleh ' . $user->name,
                    'created_at' => now(),
                ]);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('update laporan error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            
            $errorMessage = config('app.debug') 
                ? $e->getMessage() 
                : 'Gagal memperbarui laporan. Silakan periksa kembali data Anda.';
                
            return response()->json(['error' => $errorMessage], 500);
        }

        return response()->json(['message' => 'Laporan updated']);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role->nama_role, ['admin', 'operator'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $laporan = DB::table('laporan_bencana')->where('id', $id)->first();
        if (!$laporan) {
            return response()->json(['error' => 'Not Found'], 404);
        }

        // Soft delete if possible, or actual delete
        try {
            DB::beginTransaction();
            // Since there's a deleted_at column according to DB schema:
            DB::table('laporan_bencana')->where('id', $id)->update([
                'deleted_at' => now()
            ]);
            
            // Also log the deletion
            DB::table('laporan_log')->insert([
                'laporan_id' => $id,
                'user_id'    => $user->id,
                'aksi'       => 'delete',
                'catatan'    => 'Laporan dihapus oleh ' . $user->name,
                'created_at' => now(),
            ]);
            DB::commit();
            return response()->json(['message' => 'Laporan berhasil dihapus']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('delete laporan error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            
            $errorMessage = config('app.debug') 
                ? $e->getMessage() 
                : 'Gagal menghapus laporan.';
                
            return response()->json(['error' => $errorMessage], 500);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function getDetailTable(string $jenis): ?string
    {
        $map = [
            'banjir'        => 'detail_banjir',
            'banjir_bandang'=> 'detail_banjir_bandang',
            'tanah_longsor' => 'detail_tanah_longsor',
            'cuaca_ekstrim' => 'detail_cuaca_ekstrim',
            'kekeringan'    => 'detail_kekeringan',
            'karhutla'      => 'detail_karhutla',
            'wabah'         => 'detail_wabah',
            'gempa_bumi'    => 'detail_gempa_bumi',
            'konflik_sosial'=> 'detail_konflik_sosial',
        ];
        return $map[$jenis] ?? null;
    }

    /**
     * Konversi field PHP array → PostgreSQL int[] literal.
     *
     * Masalah: Laravel QueryBuilder memanggil ksort() saat memproses bindings.
     * Jika value adalah PHP array (misal penyebab_ids = [1,2,3]), ksort() crash
     * dengan TypeError karena menerima array, bukan string/integer.
     *
     * Solusi: ubah [1,2,3] → DB::raw("'{1,2,3}'") yang langsung diembed
     * ke SQL sebagai literal PostgreSQL int[], bukan sebagai PDO parameter.
     *
     * Field null / string kosong dibuang agar PostgreSQL pakai nilai DEFAULT.
     */
    private function toPostgresIntArray($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_array($value)) {
            $value = [$value];
        }

        $numbers = array_values(array_filter($value, function ($v) {
            return $v !== null && $v !== '';
        }));

        if (empty($numbers)) {
            return '{}';
        }

        $numbers = array_map(function ($v) {
            return (int) $v;
        }, $numbers);

        return '{' . implode(',', $numbers) . '}';
    }

    private function sanitizeDetailForPostgres(array $data): array
    {
        $arrayFields = [
            'penyebab_ids',
            'material_terbawa_ids',
            'kerusakan_infrastruktur_ids',
            'material_ids',
            'sektor_terdampak_ids',
            'potensi_risiko_ids',
            'upaya_masyarakat_ids',
            'dampak_struktural_ids',
            'kerusakan_jalan_ids',
            'aparat_ids',
        ];

        foreach ($arrayFields as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = $this->toPostgresIntArray($data[$field]);
            }
        }

        $result = [];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                // Fallback for arrays not defined in $arrayFields
                $ints = array_map('intval', array_filter(
                    $value,
                    fn($v) => $v !== null && $v !== ''
                ));
                $result[$key] = DB::raw("'{" . implode(',', $ints) . "}'");
            } elseif ($value !== null && $value !== '') {
                $result[$key] = $value;
            }
        }
        return $result;
    }
}
