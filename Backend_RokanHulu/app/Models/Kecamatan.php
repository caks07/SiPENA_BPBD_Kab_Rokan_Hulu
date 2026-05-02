<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kecamatan extends Model
{
    protected $table = 'kecamatan';

    protected $fillable = [
        'kode_kecamatan',
        'nama_kecamatan',
        'latitude_default',
        'longitude_default',
        'is_active',
    ];

    public function laporan(): HasMany
    {
        return $this->hasMany(LaporanBencana::class);
    }
}
