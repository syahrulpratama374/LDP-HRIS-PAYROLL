<?php

namespace Database\Seeders;

use App\Models\Departemen;
use App\Models\Golongan;
use App\Models\Jabatan;
use App\Models\Karyawan;
use App\Models\MasterPtkp;
use App\Models\MasterShift;
use App\Models\RiwayatGaji;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Struktur Organisasi PT Lintas Data Prima (LDP) 2026 + akun staf uji.
 * Idempoten: dijalankan ulang akan menyelaraskan role, departemen, jabatan, golongan, atasan,
 * no_telp dan gaji pokok aktif (password akun yang sudah ada tidak diubah).
 * Password default akun baru: password123. Super Admin memakai akun terpisah `syahrul.admin` (UserSeeder).
 */
class LdpStrukturSeeder extends Seeder
{
    public const PASSWORD_DEFAULT = 'password123';

    public const TANGGAL_GAJI_BERLAKU = '2026-01-01';

    /** Departemen LDP 2026: kode => [nama, is_wajib_logbook (shift 24/7)] */
    public const DEPARTEMEN = [
        'BOD' => ['Board of Directors', false],
        'CRE' => ['Artistic & Creative', false],
        'SLS' => ['Sales & Marketing', false],
        'HC' => ['Human Capital', false],
        'GOV' => ['Government & Partnership', false],
        'FIN' => ['Finance & Accounting', false],
        'OPM' => ['Operation & Maintenance (OPM)', true],
        'INF' => ['Infra & Backbone', false],
        'BRO' => ['Business Relation', false],
    ];

    /** Jenjang jabatan => golongan (gaji pokok) */
    public const GOLONGAN_JENJANG = [
        'CEO' => 'GOL-4A',
        'MD' => 'GOL-4A',
        'MGR' => 'GOL-3A',
        'WKM' => 'GOL-2A',
        'SPV' => 'GOL-2A',
        'STF' => 'GOL-1A',
    ];

    /**
     * Bagan organisasi (urut: atasan selalu didefinisikan sebelum bawahan).
     * username => [nama, jabatan di bagan, role_id, departemen, jenjang, atasan (username)]
     * Role: 2 Direktur, 3 HC, 4 Finance, 5 Supervisor, 6 Karyawan.
     */
    public const STRUKTUR = [
        // --- TOP MANAGEMENT ---
        'ceo' => ['Wahyu Jatmiko', 'Chief Executive Officer', 2, 'BOD', 'CEO', null],
        'md' => ['Hanif Purnomo', 'Managing Director', 2, 'BOD', 'MD', 'ceo'],

        // --- ARTISTIC & CREATIVE ---
        'fahla' => ['Fahla F Lotan', 'Head of Artistic - Creative Team', 5, 'CRE', 'MGR', 'md'],
        'staff.cre1' => ['Staff Creative 1', 'Staff Pelaksana', 6, 'CRE', 'STF', 'fahla'],

        // --- SALES & MARKETING ---
        'mikha' => ['Mikha Kristiana', 'Head of Sales & IPrime', 5, 'SLS', 'MGR', 'md'],
        'staff.iprime1' => ['Staff IPrime 1', 'Staff Pelaksana', 6, 'SLS', 'STF', 'mikha'],
        'sulistyanto' => ['Sulistyanto', 'Manager Sales & Marketing', 5, 'SLS', 'MGR', 'md'],
        'staff.sls1' => ['Staff Sales 1', 'Staff Pelaksana', 6, 'SLS', 'STF', 'sulistyanto'],

        // --- HUMAN CAPITAL ---
        'yoga' => ['Yoga Putra S', 'Manager HC', 3, 'HC', 'MGR', 'md'],
        'hakim' => ['M.A Hakim', 'SPV HC', 5, 'HC', 'SPV', 'yoga'],
        'staff.hc1' => ['Staff HC 1', 'Staff Pelaksana', 6, 'HC', 'STF', 'hakim'],

        // --- GOVERNMENT & PARTNERSHIP ---
        'yanis' => ['Yanis Taufik', 'Manager Government & Partnership', 5, 'GOV', 'MGR', 'md'],
        'staff.gov1' => ['Staff Gov & Partnership 1', 'Staff Pelaksana', 6, 'GOV', 'STF', 'yanis'],

        // --- FINANCE & ACCOUNTING ---
        'muslih' => ['Muslih Agung N', 'Manager Finance', 4, 'FIN', 'MGR', 'md'],
        'anas' => ['Anas Fauzi', 'Head of Accounting', 5, 'FIN', 'SPV', 'muslih'],
        'staff.fin1' => ['Staff Accounting 1', 'Staff Pelaksana', 6, 'FIN', 'STF', 'anas'],

        // --- OPERATION & MAINTENANCE (SHIFT 24/7) ---
        'nanang' => ['Nanang Purnomo', 'Manager OPM', 5, 'OPM', 'MGR', 'md'],
        'puji' => ['Puji Dwi H', 'SPV NOC Global', 5, 'OPM', 'SPV', 'nanang'],
        'syahrul' => ['Syahrul Pratama', 'Staff NOC Global 1', 6, 'OPM', 'STF', 'puji'],
        'staff.noc2' => ['Staff NOC Global 2', 'Staff Pelaksana', 6, 'OPM', 'STF', 'puji'],
        'septian' => ['Septian Ardianta', 'SPV POP Yogya', 5, 'OPM', 'SPV', 'nanang'],
        'staff.pop1' => ['Staff POP Yogya 1', 'Staff Pelaksana', 6, 'OPM', 'STF', 'septian'],
        'staff.pop2' => ['Staff POP Yogya 2', 'Staff Pelaksana', 6, 'OPM', 'STF', 'septian'],
        'bambang' => ['Bambang Edi L', 'SPV CS ME DC', 5, 'OPM', 'SPV', 'nanang'],
        'staff.cs1' => ['Staff CS ME DC 1', 'Staff Pelaksana', 6, 'OPM', 'STF', 'bambang'],
        'staff.cs2' => ['Staff CS ME DC 2', 'Staff Pelaksana', 6, 'OPM', 'STF', 'bambang'],

        // --- INFRA & BACKBONE ---
        'ridwan' => ['M. Ridwan Nur', 'Manager of Infra & Backbone', 5, 'INF', 'MGR', 'md'],
        'bagusdwi' => ['Bagus Dwi N', 'Wk. OPM Manager', 5, 'INF', 'WKM', 'ridwan'],
        'staff.wkopm1' => ['Staff Wk OPM 1', 'Staff Pelaksana', 6, 'INF', 'STF', 'bagusdwi'],
        'abi' => ['Abi Yoga', 'SPV Backbone', 5, 'INF', 'SPV', 'bagusdwi'],
        'staff.bb1' => ['Staff Backbone 1', 'Staff Pelaksana', 6, 'INF', 'STF', 'abi'],
        'puguh' => ['Puguh Umar', 'SPV Distribution', 5, 'INF', 'SPV', 'bagusdwi'],
        'staff.dist1' => ['Staff Distribution 1', 'Staff Pelaksana', 6, 'INF', 'STF', 'puguh'],

        // --- BUSINESS RELATION ---
        'elvira' => ['Elvira Savitri', 'Business Relation Officer', 5, 'BRO', 'MGR', 'md'],
        'staff.bro1' => ['Staff Business Relation 1', 'Staff Pelaksana', 6, 'BRO', 'STF', 'elvira'],
    ];

    /** Shift riil operasional 24/7 OPM: kode => [nama, masuk, keluar, lintas_hari, kode legacy yang diselaraskan] */
    public const SHIFT = [
        'PAGI' => ['Shift Pagi', '07:00:00', '15:00:00', false, 's2'],
        'SIANG' => ['Shift Siang', '15:00:00', '23:00:00', false, 's1'],
        'MALAM' => ['Shift Malam', '23:00:00', '07:00:00', true, null],
    ];

    public function run(): void
    {
        $this->call(MasterDataSeeder::class);

        $departemen = [];
        foreach (self::DEPARTEMEN as $kode => [$nama, $wajibLogbook]) {
            $departemen[$kode] = Departemen::updateOrCreate(
                ['kode_departemen' => $kode],
                ['nama_departemen' => $nama, 'is_wajib_logbook' => $wajibLogbook]
            );
        }

        $jabatan = Jabatan::whereIn('kode_jabatan', array_keys(self::GOLONGAN_JENJANG))->get()->keyBy('kode_jabatan');
        $golongan = Golongan::whereIn('kode_golongan', array_unique(self::GOLONGAN_JENJANG))->get()->keyBy('kode_golongan');
        $ptkp = MasterPtkp::firstOrCreate(
            ['kode_ptkp' => 'TK/0'],
            ['deskripsi' => 'Tidak Kawin, Tanpa Tanggungan', 'nominal_neto_tahunan' => 54000000]
        );

        $karyawan = [];
        $urut = 0;
        foreach (self::STRUKTUR as $username => [$nama, , $roleId, $kodeDept, $jenjang, $atasan]) {
            $urut++;
            $gol = $golongan[self::GOLONGAN_JENJANG[$jenjang]];

            $karyawan[$username] = $this->sinkronKaryawan(
                $username, $nama, $roleId,
                $departemen[$kodeDept]->id,
                $jabatan[$jenjang]->id,
                $gol,
                $ptkp->id,
                $atasan ? $karyawan[$atasan]->id : null,
                sprintf('62812000000%02d', $urut),
                sprintf('LDP-26%03d', $urut),
            );
        }

        $this->sinkronShift();

        $this->command?->info('Struktur Organisasi LDP 2026 tersinkron: '.count($karyawan).' karyawan, gaji pokok aktif & shift OPM siap uji.');
    }

    private function sinkronKaryawan(
        string $username, string $nama, int $roleId, int $deptId, int $jabatanId,
        Golongan $golongan, int $ptkpId, ?int $atasanId, string $noTelp, string $nikBaru
    ): Karyawan {
        $email = "{$username}@ldp.co.id";

        $user = User::firstOrNew(['email' => $email]);
        $user->fill(['name' => $nama, 'username' => $username, 'role_id' => $roleId]);
        if (! $user->exists) {
            $user->password = Hash::make(self::PASSWORD_DEFAULT);
            $user->email_verified_at = now();
        }
        $user->save();

        $karyawan = Karyawan::withTrashed()->firstOrNew(['user_id' => $user->id]);
        if (! $karyawan->exists) {
            $karyawan->fill([
                'nik_internal' => $nikBaru,
                'tempat_lahir' => 'Yogyakarta',
                'tgl_lahir' => '1990-01-01',
                'agama' => 'Islam',
                'status_pernikahan' => 'Belum Kawin',
                'tgl_bergabung' => '2026-01-01',
                'no_ktp_encrypted' => 'DUMMY_KTP_ENCRYPTED_1234567890',
            ]);
        }
        $karyawan->fill([
            'nama_lengkap' => $nama,
            'departemen_id' => $deptId,
            'jabatan_id' => $jabatanId,
            'golongan_id' => $golongan->id,
            'ptkp_id' => $karyawan->ptkp_id ?: $ptkpId,
            'atasan_id' => $atasanId,
            'email_kantor' => $email,
            'no_telp' => $noTelp,
            'status_aktif' => true,
        ]);
        $karyawan->deleted_at = null;
        $karyawan->save();

        // Gaji pokok aktif agar Kasbon & Payroll langsung bisa diuji
        RiwayatGaji::updateOrCreate(
            ['karyawan_id' => $karyawan->id, 'effective_date_start' => self::TANGGAL_GAJI_BERLAKU],
            ['nominal_gaji_pokok' => $golongan->gaji_pokok, 'effective_date_end' => null]
        );

        return $karyawan;
    }

    private function sinkronShift(): void
    {
        foreach (self::SHIFT as $kode => [$nama, $masuk, $keluar, $lintasHari, $legacy]) {
            $shift = MasterShift::where('kode_shift', $kode)->first()
                ?? ($legacy ? MasterShift::where('kode_shift', $legacy)->first() : null)
                ?? new MasterShift;

            // Shift uji lama (s1/s2) diselaraskan in-place agar jadwal & logbook yang merujuknya tetap valid
            $shift->fill([
                'kode_shift' => $kode,
                'nama_shift' => $nama,
                'jam_masuk' => $masuk,
                'jam_keluar' => $keluar,
                'lintas_hari' => $lintasHari,
            ])->save();
        }
    }
}
