<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * UserAccountSeeder
 *
 * Membuat/update akun user final untuk sistem SiPENA BPBD Rokan Hulu.
 * Idempotent: aman dijalankan berkali-kali, tidak membuat duplikat.
 *
 * Roles yang dipakai (sesuai tabel `roles`):
 *   - admin     (id=1) → Admin Kabupaten
 *   - pimpinan  (id=2) → Kepala BPBD
 *   - operator  (id=3) → User Kecamatan (Admin Kecamatan)
 */
class UserAccountSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil ID role berdasarkan nama (tidak hardcode ID)
        $roleAdmin    = DB::table('roles')->where('nama_role', 'admin')->value('id');
        $rolePimpinan = DB::table('roles')->where('nama_role', 'pimpinan')->value('id');
        $roleOperator = DB::table('roles')->where('nama_role', 'operator')->value('id');

        if (!$roleAdmin || !$rolePimpinan || !$roleOperator) {
            $this->command->error('Roles belum ada! Jalankan ReferenceOptionsSeeder terlebih dahulu.');
            return;
        }

        // ─────────────────────────────────────────────────
        // 1. Admin Kabupaten
        // ─────────────────────────────────────────────────
        $this->upsertUser([
            'username'     => 'adminkabupaten',
            'name'         => 'Admin Kabupaten',
            'password'     => 'rohultanggapdarurat',
            'role_id'      => $roleAdmin,
            'kecamatan_id' => null,
        ]);

        // ─────────────────────────────────────────────────
        // 2. Kepala BPBD
        // ─────────────────────────────────────────────────
        $this->upsertUser([
            'username'     => 'kepalabpbd',
            'name'         => 'Kepala BPBD',
            'password'     => 'rohultanggapdarurat',
            'role_id'      => $rolePimpinan,
            'kecamatan_id' => null,
        ]);

        // ─────────────────────────────────────────────────
        // 3. User Kecamatan (16 kecamatan)
        // ─────────────────────────────────────────────────
        $kecamatanUsers = [
            ['Bangun Purba',             'bangunpurba',   'bangunpurbatanggapdarurat'],
            ['Bonai Darussalam',         'bonai',         'bonaitanggapdarurat'],
            ['Kabun',                    'kabun',         'kabuntanggapdarurat'],
            ['Kepenuhan',                'kepenuhan',     'kepenuhantanggapdarurat'],
            ['Kepenuhan Hulu',           'kepenuhanhulu', 'kepenuhanhulutanggapdarurat'],
            ['Kunto Darussalam',         'kunto',         'kuntotanggapdarurat'],
            ['Pagaran Tapah Darussalam', 'pagarantapah',  'pagarantapahtanggapdarurat'],
            ['Pendalian IV Koto',        'pendalian',     'pendaliantanggapdarurat'],
            ['Rambah',                   'rambah',        'rambahtanggapdarurat'],
            ['Rambah Hilir',             'rambahhilir',   'rambahhilirtanggapdarurat'],
            ['Rambah Samo',              'rambahsamo',    'rambahsamotanggapdarurat'],
            ['Rokan IV Koto',            'rokan',         'rokantanggapdarurat'],
            ['Tambusai',                 'tambusai',      'tambusaitanggapdarurat'],
            ['Tambusai Utara',           'tambura',       'tamburatanggapdarurat'],
            ['Tandun',                   'tandun',        'tanduntanggapdarurat'],
            ['Ujung Batu',               'ujungbatu',     'ujungbatutanggapdarurat'],
        ];

        foreach ($kecamatanUsers as [$namaKec, $username, $password]) {
            $kecamatanId = DB::table('kecamatan')
                ->where('nama_kecamatan', $namaKec)
                ->value('id');

            if (!$kecamatanId) {
                $this->command->warn("  [SKIP] Kecamatan '{$namaKec}' tidak ditemukan di database.");
                continue;
            }

            $this->upsertUser([
                'username'     => $username,
                'name'         => 'Admin ' . $namaKec,
                'password'     => $password,
                'role_id'      => $roleOperator,
                'kecamatan_id' => $kecamatanId,
            ]);
        }

        $total = DB::table('users')->count();
        $this->command->info("UserAccountSeeder selesai. Total user di database: {$total}");

        // ─────────────────────────────────────────────────
        // System settings: password form laporan
        // ─────────────────────────────────────────────────
        if (DB::getSchemaBuilder()->hasTable('system_settings')) {
            $existsHash = DB::table('system_settings')
                ->where('key', 'report_form_password_hash')
                ->exists();

            if (!$existsHash) {
                DB::table('system_settings')->insert([
                    'key'        => 'report_form_password_hash',
                    'value'      => Hash::make('rohultanggap'),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->command->line('  [INSERT] system_settings: report_form_password_hash');
            }

            $existsPlain = DB::table('system_settings')
                ->where('key', 'report_form_password_plain')
                ->exists();

            if (!$existsPlain) {
                DB::table('system_settings')->insert([
                    'key'        => 'report_form_password_plain',
                    'value'      => 'rohultanggap',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->command->line('  [INSERT] system_settings: report_form_password_plain');
            }
        } else {
            $this->command->warn('  [SKIP] Tabel system_settings belum ada. Jalankan migrate dulu.');
        }
    }

    /**
     * Insert atau update user berdasarkan username.
     * Password selalu di-hash dengan Hash::make().
     */
    private function upsertUser(array $data): void
    {
        $existing = DB::table('users')->where('username', $data['username'])->first();

        $payload = [
            'name'           => $data['name'],
            'username'       => $data['username'],
            'password'       => Hash::make($data['password']),
            'password_plain' => $data['password'],
            'role_id'        => $data['role_id'],
            'kecamatan_id'   => $data['kecamatan_id'],
            'is_active'      => true,
            'updated_at'     => now(),
        ];

        if ($existing) {
            DB::table('users')->where('username', $data['username'])->update($payload);
            $this->command->line("  [UPDATE] username={$data['username']} | name={$data['name']}");
        } else {
            $payload['created_at'] = now();
            DB::table('users')->insert($payload);
            $this->command->line("  [INSERT] username={$data['username']} | name={$data['name']}");
        }
    }
}
