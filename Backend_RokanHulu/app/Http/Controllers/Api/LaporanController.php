<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Laporan\PatchSeverityRequest;
use App\Http\Requests\Laporan\StoreLaporanRequest;
use App\Http\Requests\Laporan\UpdateLaporanRequest;
use App\Models\LaporanBencana;
use App\Services\LaporanService;
use Illuminate\Http\Request;

class LaporanController extends Controller
{
    public function __construct(private readonly LaporanService $laporanService)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', LaporanBencana::class);

        return response()->json(
            $this->laporanService->paginate(
                $request->only(['jenis_bencana', 'kecamatan_id', 'severity_level', 'start_date', 'end_date']),
                $request->attributes->get('current_role'),
                (int) $request->attributes->get('current_kecamatan_id')
            )
        );
    }

    public function show(int $id, Request $request)
    {
        $laporan = LaporanBencana::query()
            ->with(['kecamatan', 'korban', 'kerusakan', 'detailBanjir'])
            ->findOrFail($id);

        $this->authorize('view', $laporan);

        $detailName = $laporan->detailRelationName();

        return response()->json([
            'laporan' => $laporan,
            'detail_relation' => $detailName,
            'detail' => $detailName ? $laporan->{$detailName} : null,
        ]);
    }

    public function store(StoreLaporanRequest $request)
    {
        $this->authorize('create', LaporanBencana::class);

        $payload = $request->validated();
        $payload['created_by_user_id'] = $request->user()?->id;
        $laporan = $this->laporanService->create($payload);
        return response()->json($laporan, 201);
    }

    public function update(int $id, UpdateLaporanRequest $request)
    {
        $laporan = LaporanBencana::findOrFail($id);
        $this->authorize('update', $laporan);

        return response()->json($this->laporanService->update($laporan, $request->validated()));
    }

    public function updateSeverity(int $id, PatchSeverityRequest $request)
    {
        $laporan = LaporanBencana::findOrFail($id);
        $this->authorize('update', $laporan);
        $laporan->update($request->validated());

        return response()->json($laporan);
    }

    public function destroy(int $id, Request $request)
    {
        $laporan = LaporanBencana::findOrFail($id);
        $this->authorize('delete', $laporan);
        $laporan->delete();

        return response()->json(['message' => 'Laporan berhasil dihapus.']);
    }
}
