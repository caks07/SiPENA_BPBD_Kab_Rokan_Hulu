<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetailBanjir extends Model
{
    protected $table = 'detail_banjir';
    protected $primaryKey = 'laporan_id';
    public $incrementing = false;

    protected $fillable = [
        'laporan_id',
        'kondisi_cuaca_id',
        'penyebab_id',
        'penyebab_lain',
        'ketinggian_banjir_id',
        'ketinggian_banjir_lain',
        'kondisi_air_id',
        'luas_genangan',
    ];

    public function laporan(): BelongsTo
    {
        return $this->belongsTo(LaporanBencana::class, 'laporan_id');
    }
}
