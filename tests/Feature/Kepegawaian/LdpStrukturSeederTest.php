<?php

namespace Tests\Feature\Kepegawaian;

use App\Models\Karyawan;
use App\Models\User;
use App\Services\KasbonLimitService;
use Database\Seeders\LdpStrukturSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LdpStrukturSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach ([1 => 'Admin', 2 => 'Direktur', 3 => 'HC', 4 => 'Finance', 5 => 'Supervisor', 6 => 'Karyawan'] as $id => $nama) {
            DB::table('roles')->insert(['id' => $id, 'nama_role' => $nama, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    private function karyawan(string $username): Karyawan
    {
        return User::where('username', $username)->firstOrFail()->karyawan;
    }

    public function test_struktur_ldp_2026_idempoten_dan_lengkap(): void
    {
        $this->seed(LdpStrukturSeeder::class);
        $this->seed(LdpStrukturSeeder::class);

        $jumlah = count(LdpStrukturSeeder::STRUKTUR);
        $this->assertSame($jumlah, User::where('email', 'like', '%@ldp.co.id')->count());
        $this->assertSame($jumlah, DB::table('riwayat_gajis')->whereNull('effective_date_end')->count());
        $this->assertSame(0, Karyawan::whereNull('no_telp')->count());

        $this->assertNull($this->karyawan('ceo')->atasan_id);
        $this->assertSame($this->karyawan('puji')->id, $this->karyawan('syahrul')->atasan_id);
        $this->assertSame(6, User::where('username', 'syahrul')->value('role_id'));
        $this->assertSame($this->karyawan('bagusdwi')->id, $this->karyawan('abi')->atasan_id);
        $this->assertSame('OPM', $this->karyawan('staff.cs2')->departemen->kode_departemen);
        $this->assertTrue($this->karyawan('staff.cs2')->departemen->is_wajib_logbook);

        // Kasbon langsung punya gaji pokok aktif
        $this->assertEquals(4500000, app(KasbonLimitService::class)->gajiPokok($this->karyawan('staff.bro1')->id));
        $this->assertEquals(3, DB::table('master_shifts')->whereIn('kode_shift', ['PAGI', 'SIANG', 'MALAM'])->count());
    }
}
