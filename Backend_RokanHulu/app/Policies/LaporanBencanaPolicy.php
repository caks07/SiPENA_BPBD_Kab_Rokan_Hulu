<?php

namespace App\Policies;

use App\Models\LaporanBencana;
use App\Models\User;

class LaporanBencanaPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role?->nama_role, ['admin', 'pimpinan', 'operator'], true);
    }

    public function view(User $user, LaporanBencana $laporanBencana): bool
    {
        if ($user->role?->nama_role === 'admin' || $user->role?->nama_role === 'pimpinan') {
            return true;
        }

        return $user->role?->nama_role === 'operator' && (int) $user->kecamatan_id === (int) $laporanBencana->kecamatan_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role?->nama_role, ['admin', 'operator'], true);
    }

    public function update(User $user, LaporanBencana $laporanBencana): bool
    {
        if ($user->role?->nama_role === 'admin') {
            return true;
        }

        return $user->role?->nama_role === 'operator' && (int) $user->kecamatan_id === (int) $laporanBencana->kecamatan_id;
    }

    public function delete(User $user, LaporanBencana $laporanBencana): bool
    {
        return $user->role?->nama_role === 'admin';
    }

    public function restore(User $user, LaporanBencana $laporanBencana): bool
    {
        return $user->role?->nama_role === 'admin';
    }

    public function forceDelete(User $user, LaporanBencana $laporanBencana): bool
    {
        return $user->role?->nama_role === 'admin';
    }
}
