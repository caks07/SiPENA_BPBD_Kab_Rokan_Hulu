<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class LaporanBencana extends Model
{
    use SoftDeletes;

    protected $table = 'laporan_bencana';

    protected $fillable = [
        'jenis_bencana',
        'nama_pelapor',
        'sumber_laporan',
        'created_by_user_id',
        'kecamatan_id',
        'lokasi_text',
        'latitude',
        'longitude',
        'location_geom',
        'sumber_koordinat',
        'waktu_kejadian',
        'status',
        'severity_level',
        'is_baru',
    ];

    public function kecamatan(): BelongsTo
    {
        return $this->belongsTo(Kecamatan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function korban(): HasOne
    {
        return $this->hasOne(KorbanBencana::class, 'laporan_id');
    }

    public function kerusakan(): HasOne
    {
        return $this->hasOne(KerusakanBencana::class, 'laporan_id');
    }

    public function detailBanjir(): HasOne
    {
        return $this->hasOne(DetailBanjir::class, 'laporan_id');
    }

    public function detailRelationName(): ?string
    {
        return match ($this->jenis_bencana) {
            'banjir' => 'detailBanjir',
            default => null,
        };
    }
}
