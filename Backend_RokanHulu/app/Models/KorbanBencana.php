<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KorbanBencana extends Model
{
    protected $table = 'korban_bencana';
    protected $primaryKey = 'laporan_id';
    public $incrementing = false;

    protected $fillable = [
        'laporan_id',
        'korban_luka_ringan',
        'korban_luka_berat',
        'korban_meninggal',
        'korban_hilang',
        'kk_mengungsi',
        'jiwa_mengungsi',
    ];

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(LaporanBencana::class, 'laporan_id');
    }
}
