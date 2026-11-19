<?php

namespace Tests\Feature\Spj;

use Database\Seeders\LdpStrukturSeeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/** nama_posisi, kategori tarif untuk instalasi baru, dan rekening dummy data uji. */
class DataKaryawanSpjTest extends SpjTestCase
{
    private function karyawan(string $username): object
    {
        return DB::table('karyawans')->join('users', 'users.id', '=', 'karyawans.user_id')
            ->where('users.username', $username)->select('karyawans.*')->first();
    }

    public function test_seeder_struktur_mengisi_nama_posisi_dan_kategori_tanpa_menimpa(): void
    {
        $this->seed(LdpStrukturSeeder::class);

        $this->assertSame('Head of Artistic - Creative Team', $this->karyawan('fahla')->nama_posisi);
        $this->assertSame('Staff', $this->karyawan('fahla')->kategori_tarif_spj);
        $this->assertSame('Manager', $this->karyawan('yoga')->kategori_tarif_spj);
        $this->assertSame('Direksi', $this->karyawan('ceo')->kategori_tarif_spj);
        $this->assertSame('Staff', $this->karyawan('anas')->kategori_tarif_spj);

        DB::table('karyawans')->where('id', $this->karyawan('fahla')->id)
            ->update(['nama_posisi' => 'Diubah HC', 'kategori_tarif_spj' => 'Manager']);
        $this->seed(LdpStrukturSeeder::class);

        $this->assertSame('Diubah HC', $this->karyawan('fahla')->nama_posisi);
        $this->assertSame('Manager', $this->karyawan('fahla')->kategori_tarif_spj);
    }

    public function test_migrasi_nama_posisi_hanya_mengisi_yang_kosong_dan_bisa_dibalik(): void
    {
        $fahla = $this->karyawanSpj('fahla', 5, $this->jabatanManager);
        $yoga = $this->karyawanSpj('yoga', 3, $this->jabatanManager);
        DB::table('karyawans')->where('user_id', $yoga->id)->update(['nama_posisi' => 'Manager HC (koreksi)']);

        $migrasi = require database_path('migrations/2026_11_22_100100_isi_nama_posisi_struktur_ldp.php');
        $migrasi->up();

        $this->assertSame('Head of Artistic - Creative Team', $this->karyawan('fahla')->nama_posisi);
        $this->assertSame('Manager HC (koreksi)', $this->karyawan('yoga')->nama_posisi);

        $migrasi->down();
        $this->assertNull($this->karyawan('fahla')->nama_posisi);
        $this->assertSame('Manager HC (koreksi)', $this->karyawan('yoga')->nama_posisi);
    }

    public function test_migrasi_rekening_dummy_hanya_bila_kosong_dan_bisa_dibalik(): void
    {
        $this->karyawanSpj('fahla', 5, $this->jabatanManager);
        $cre = $this->karyawanSpj('staff.cre1');
        $this->beriRekening($cre, '1111222233'); // sudah punya rekening asli: tidak disentuh

        $migrasi = require database_path('migrations/2026_11_22_100200_isi_rekening_dummy_uji_spj.php');
        $migrasi->up();
        $migrasi->up();

        $this->assertSame('9990000001', Crypt::decryptString($this->karyawan('fahla')->no_rek_bca_encrypted));
        $this->assertSame('1111222233', Crypt::decryptString($this->karyawan('staff.cre1')->no_rek_bca_encrypted));

        $migrasi->down();
        $this->assertNull($this->karyawan('fahla')->no_rek_bca_encrypted);
        $this->assertSame('1111222233', Crypt::decryptString($this->karyawan('staff.cre1')->no_rek_bca_encrypted));
    }
}
