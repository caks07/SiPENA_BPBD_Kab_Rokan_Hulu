<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KerusakanBencana extends Model
{
    protected $table = 'kerusakan_bencana';
    protected $primaryKey = 'laporan_id';
    public $incrementing = false;

    protected $fillable = [
        'laporan_id',
        'rumah_rusak_ringan',
        'rumah_rusak_sedang',
        'rumah_rusak_berat',
        'catatan_fasilitas_umum',
        'catatan_lain',
    ];

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(LaporanBencana::class, 'laporan_id');
    }
}
