<?php

namespace App\Services;

use App\Models\LaporanBencana;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LaporanService
{
    public function paginate(array $filters, ?string $role, ?int $kecamatanId): LengthAwarePaginator
    {
        $query = LaporanBencana::query()
            ->with(['kecamatan', 'korban'])
            ->when($filters['jenis_bencana'] ?? null, fn ($q, $val) => $q->where('jenis_bencana', $val))
            ->when($filters['kecamatan_id'] ?? null, fn ($q, $val) => $q->where('kecamatan_id', (int) $val))
            ->when($filters['severity_level'] ?? null, fn ($q, $val) => $q->where('severity_level', (int) $val))
            ->when($filters['start_date'] ?? null, fn ($q, $val) => $q->whereDate('waktu_kejadian', '>=', $val))
            ->when($filters['end_date'] ?? null, fn ($q, $val) => $q->whereDate('waktu_kejadian', '<=', $val));

        if ($role === 'operator' && $kecamatanId) {
            $query->where('kecamatan_id', $kecamatanId);
        }

        return $query->latest('waktu_kejadian')->paginate(20);
    }

    public function create(array $payload): LaporanBencana
    {
        return DB::transaction(function () use ($payload) {
            $detail = $payload['detail'] ?? [];
            unset($payload['detail']);

            $payload['location_geom'] = DB::raw("ST_SetSRID(ST_MakePoint({$payload['longitude']}, {$payload['latitude']}), 4326)");
            $laporan = LaporanBencana::create($payload);

            if ($laporan->jenis_bencana === 'banjir' && $detail) {
                $laporan->detailBanjir()->create($detail);
            }

            return $laporan->load(['kecamatan', 'korban', 'kerusakan', 'detailBanjir']);
        });
    }

    public function update(LaporanBencana $laporan, array $payload): LaporanBencana
    {
        return DB::transaction(function () use ($laporan, $payload) {
            $detail = $payload['detail'] ?? null;
            unset($payload['detail']);

            if (isset($payload['latitude'], $payload['longitude'])) {
                $payload['location_geom'] = DB::raw("ST_SetSRID(ST_MakePoint({$payload['longitude']}, {$payload['latitude']}), 4326)");
            }

            $laporan->update($payload);

            if ($laporan->jenis_bencana === 'banjir' && is_array($detail)) {
                $laporan->detailBanjir()->updateOrCreate(['laporan_id' => $laporan->id], $detail);
            }

            return $laporan->fresh(['kecamatan', 'korban', 'kerusakan', 'detailBanjir']);
        });
    }
}
