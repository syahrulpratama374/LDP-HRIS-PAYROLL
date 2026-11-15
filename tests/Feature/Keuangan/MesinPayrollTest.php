<?php

namespace Tests\Feature\Keuangan;

use App\Models\Payroll;
use App\Services\Payroll\BpjsCalculator;
use App\Services\Payroll\LemburCalculator;
use App\Services\Payroll\Pph21TerCalculator;
use Database\Seeders\MasterTarifTerSeeder;
use Illuminate\Support\Facades\DB;

class MesinPayrollTest extends KeuanganTestCase
{
    private array $cfg = [
        'bpjs_jht_karyawan' => 2, 'bpjs_jp_karyawan' => 1, 'bpjs_kes_karyawan' => 1,
        'bpjs_jht_perusahaan' => 3.7, 'bpjs_jp_perusahaan' => 2, 'bpjs_kes_perusahaan' => 4,
        'bpjs_jkk_perusahaan' => 0.24, 'bpjs_jkm_perusahaan' => 0.3,
        'bpjs_batas_upah_jp' => 10_000_000, 'bpjs_batas_upah_kes' => 12_000_000,
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(MasterTarifTerSeeder::class);
        DB::table('master_ptkps')->insert([
            'id' => 1, 'kode_ptkp' => 'TK/0', 'nominal_neto_tahunan' => 54_000_000, 'kategori_ter' => 'A',
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function gaji(int $karyawanId, float $nominal): void
    {
        DB::table('riwayat_gajis')->insert([
            'karyawan_id' => $karyawanId, 'nominal_gaji_pokok' => $nominal,
            'effective_date_start' => '2024-01-01', 'effective_date_end' => null,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function generate($admin, int $bulan = 1, int $tahun = 2026)
    {
        return $this->actingAs($admin)->post(route('admin.payroll.generate'), ['periode_bulan' => $bulan, 'periode_tahun' => $tahun]);
    }

    public function test_tarif_ter_per_kategori(): void
    {
        $ter = new Pph21TerCalculator();
        $this->assertSame(0.0, $ter->tarifTer('A', 5_400_000));
        $this->assertSame(0.25, $ter->tarifTer('A', 5_400_001));
        $this->assertSame(1.5, $ter->tarifTer('A', 8_000_000));
        $this->assertSame(34.0, $ter->tarifTer('A', 2_000_000_000));
        $this->assertSame(0.0, $ter->tarifTer('B', 6_200_000));
        $this->assertSame(0.0, $ter->tarifTer('C', 6_600_000));
        $this->assertSame(200_000.0, $ter->hitungBulanan('A', 10_000_000)['pph']); // 2% × 10 jt
    }

    public function test_kategori_ter_dari_kode_ptkp(): void
    {
        $ter = new Pph21TerCalculator();
        $this->assertSame('A', $ter->kategori(null, 'TK/1'));
        $this->assertSame('A', $ter->kategori(null, 'K/0'));
        $this->assertSame('B', $ter->kategori(null, 'TK/2'));
        $this->assertSame('B', $ter->kategori(null, 'K/1'));
        $this->assertSame('B', $ter->kategori(null, 'K/2'));
        $this->assertSame('C', $ter->kategori(null, 'K/3'));
        $this->assertSame('B', $ter->kategori('B', 'TK/0'));
    }

    public function test_pasal_17_berlapis(): void
    {
        $ter = new Pph21TerCalculator();
        $this->assertSame(3_000_000.0, $ter->pasal17(60_000_000));
        $this->assertSame(9_000_000.0, $ter->pasal17(100_000_000)); // 3 jt + 40 jt × 15%
        $this->assertSame(0.0, $ter->pasal17(0));
    }

    public function test_pph_desember_rekonsiliasi(): void
    {
        $ter = new Pph21TerCalculator();
        // bruto 120 jt, biaya jabatan 5% = 6 jt (maks), iuran 3 jt, PTKP 54 jt → neto 111 jt, PKP 57 jt → 2,85 jt
        $h = $ter->hitungDesember('A', 120_000_000, 3_000_000, 54_000_000, 2_000_000, 5, 6_000_000);
        $this->assertSame(57_000_000.0, (float) $h['rincian']['pkp']);
        $this->assertSame(2_850_000.0, (float) $h['rincian']['pph_setahun']);
        $this->assertSame(850_000.0, $h['pph']);
        $this->assertNull($h['peringatan']);

        $lebih = $ter->hitungDesember('A', 120_000_000, 3_000_000, 54_000_000, 4_000_000, 5, 6_000_000);
        $this->assertSame(0.0, $lebih['pph']);
        $this->assertNotNull($lebih['peringatan']);
    }

    public function test_bpjs_memakai_batas_upah(): void
    {
        $r = (new BpjsCalculator())->hitung(15_000_000, $this->cfg);
        $this->assertSame(300_000.0, $r['jht']);   // 2% × 15 jt (tanpa batas)
        $this->assertSame(100_000.0, $r['jp']);    // 1% × 10 jt (batas JP)
        $this->assertSame(120_000.0, $r['kes']);   // 1% × 12 jt (batas Kesehatan)
        $this->assertSame(520_000.0, $r['total_karyawan']);
        $this->assertSame(400_000.0, $r['iuran_pensiun']); // JHT 300.000 + JP 100.000
    }

    public function test_lembur_lintas_tengah_malam_dan_metode(): void
    {
        $l = new LemburCalculator();
        $this->assertSame(4.0, $l->durasiJam('22:00:00', '02:00:00'));
        $this->assertSame(1.5, $l->durasiJam('08:00:00', '09:30:00'));

        $data = collect([(object) ['tanggal' => '2026-01-05', 'jam_mulai' => '22:00:00', 'jam_selesai' => '02:00:00']]); // Senin
        $this->assertSame(100_000.0, $l->hitung($data, 0, 'flat', 25_000)['total']);
        // 173.000/173 = 1.000/jam; jam 1 ×1,5, jam 2–4 ×2 → 1.500 + 6.000
        $this->assertSame(7_500.0, $l->hitung($data, 173_000, 'kepmenaker', 0)['total']);
    }

    public function test_generate_menghitung_komponen_bpjs_dan_pph_ter(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $this->gaji($kid, 8_000_000);

        $this->generate($admin)->assertSessionHasNoErrors();

        $p = Payroll::with('detailPayrolls')->where('karyawan_id', $kid)->first();
        $this->assertSame('Draft', $p->status);
        $d = $p->detailPayrolls->pluck('nominal', 'nama_komponen_snapshot');
        $this->assertEquals(8_000_000, $d['Gaji Pokok']);
        $this->assertEquals(160_000, $d['Iuran BPJS JHT (2%)']);
        $this->assertEquals(80_000, $d['Iuran BPJS JP (1%)']);
        $this->assertEquals(80_000, $d['Iuran BPJS Kesehatan (1%)']);

        // bruto = 8.000.000 + JKK 19.200 + JKM 24.000 + Kes perusahaan 320.000 = 8.363.200 → TER A 1,5%
        $this->assertEquals(8_363_200, $p->bruto_pajak);
        $this->assertEquals(125_448, $p->pph21);
        $this->assertSame('TER', $p->rincian_pajak['metode']);
        $this->assertEquals(8_000_000 - 160_000 - 80_000 - 80_000 - 125_448, $p->total_gaji_bersih);
    }

    public function test_generate_idempoten_dan_efek_samping_baru_saat_finalize(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $this->gaji($kid, 5_000_000);

        $pinjaman = $this->buatPinjaman($kid, ['status' => 'Berjalan', 'total_pinjaman' => 200000, 'sisa_pinjaman' => 200000, 'tenor_bulan' => 2]);
        $cicilan = DB::table('cicilan_pinjamans')->insertGetId([
            'pinjaman_id' => $pinjaman, 'nominal_cicilan' => 100000, 'jatuh_tempo' => '2026-01-25',
            'status_bayar' => 'Belum Lunas', 'metode_pelunasan' => 'Potong Gaji', 'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('cicilan_pinjamans')->insert([
            'pinjaman_id' => $pinjaman, 'nominal_cicilan' => 100000, 'jatuh_tempo' => '2026-02-25',
            'status_bayar' => 'Belum Lunas', 'metode_pelunasan' => 'Potong Gaji', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $spj = DB::table('pengajuan_spjs')->insertGetId([
            'karyawan_id' => $kid, 'tujuan' => 'Surabaya', 'keperluan' => 'Meeting', 'tgl_mulai' => '2026-01-10',
            'tgl_selesai' => '2026-01-11', 'total_biaya' => 300000, 'status_approval' => 'Selesai', 'sudah_dibayar' => false,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->generate($admin)->assertSessionHasNoErrors();
        $this->generate($admin)->assertSessionHasNoErrors();

        $p = Payroll::where('karyawan_id', $kid)->firstOrFail();
        $this->assertSame(1, Payroll::where('karyawan_id', $kid)->count());
        $detail = $p->detailPayrolls()->pluck('nominal', 'nama_komponen_snapshot');
        $this->assertEquals(100_000, $detail['Cicilan Kasbon']);   // hanya cicilan Januari
        $this->assertEquals(300_000, $detail['Pencairan SPJ']);

        // Setelah dua kali generate Draft, tidak ada perubahan status/saldo
        $this->assertDatabaseHas('cicilan_pinjamans', ['id' => $cicilan, 'status_bayar' => 'Belum Lunas', 'payroll_id' => $p->id]);
        $this->assertSame(200000.0, (float) DB::table('pinjaman_karyawans')->where('id', $pinjaman)->value('sisa_pinjaman'));
        $this->assertDatabaseHas('pengajuan_spjs', ['id' => $spj, 'sudah_dibayar' => 0, 'payroll_id' => $p->id]);

        $this->actingAs($admin)->post(route('admin.payroll.finalize', $p->id))->assertSessionHasNoErrors();

        $this->assertDatabaseHas('cicilan_pinjamans', ['id' => $cicilan, 'status_bayar' => 'Lunas']);
        $this->assertSame(100000.0, (float) DB::table('pinjaman_karyawans')->where('id', $pinjaman)->value('sisa_pinjaman'));
        $this->assertDatabaseHas('pengajuan_spjs', ['id' => $spj, 'sudah_dibayar' => 1]);
        $this->assertSame('Disetujui', $p->fresh()->status);

        // Generate ulang setelah final tidak mengubah slip
        $this->generate($admin)->assertSessionHasNoErrors();
        $this->assertSame(1, $p->detailPayrolls()->where('nama_komponen_snapshot', 'Cicilan Kasbon')->count());
    }

    public function test_komponen_tetap_karyawan_ikut_digenerate_dan_taxable_masuk_bruto(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $this->gaji($kid, 5_000_000);

        $makan = DB::table('master_komponen_payrolls')->insertGetId([
            'kode_komponen' => 'TJ-MAKAN', 'nama_komponen' => 'Tunjangan Makan', 'jenis' => 'Pemasukan', 'is_taxable' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $transport = DB::table('master_komponen_payrolls')->insertGetId([
            'kode_komponen' => 'TJ-TRANS', 'nama_komponen' => 'Tunjangan Transport', 'jenis' => 'Pemasukan', 'is_taxable' => false,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        foreach ([[$makan, 500_000], [$transport, 200_000]] as [$komp, $nominal]) {
            DB::table('komponen_payroll_karyawan')->insert([
                'karyawan_id' => $kid, 'komponen_id' => $komp, 'nominal' => $nominal, 'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $this->generate($admin)->assertSessionHasNoErrors();
        $p = Payroll::with('detailPayrolls')->where('karyawan_id', $kid)->firstOrFail();

        $this->assertEquals(5_700_000, $p->total_pemasukan);
        $this->assertSame($makan, (int) $p->detailPayrolls->firstWhere('nama_komponen_snapshot', 'Tunjangan Makan')->komponen_id);
        // bruto pajak: 5.000.000 + 500.000 (taxable) + premi perusahaan; transport tidak ikut
        $premi = round(5_000_000 * 0.0024) + round(5_000_000 * 0.003) + round(5_000_000 * 0.04);
        $this->assertEquals(5_500_000 + $premi, $p->bruto_pajak);
    }

    public function test_karyawan_masuk_tengah_bulan_diprorata(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $this->gaji($kid, 3_100_000);
        DB::table('karyawans')->where('id', $kid)->update(['tgl_bergabung' => '2026-01-16']);

        $this->generate($admin)->assertSessionHasNoErrors();
        $p = Payroll::where('karyawan_id', $kid)->firstOrFail();
        $this->assertEquals(1_600_000, $p->gaji_pokok_saat_itu); // 16/31 × 3,1 jt
    }

    public function test_peringatan_gaji_bersih_negatif(): void
    {
        [$admin] = $this->buatUser(1);
        [, $kid] = $this->buatUser(6);
        $this->gaji($kid, 1_000_000);
        $pinjaman = $this->buatPinjaman($kid, ['status' => 'Berjalan']);
        DB::table('cicilan_pinjamans')->insert([
            'pinjaman_id' => $pinjaman, 'nominal_cicilan' => 2_000_000, 'jatuh_tempo' => '2026-01-25',
            'status_bayar' => 'Belum Lunas', 'metode_pelunasan' => 'Potong Gaji', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->generate($admin)->assertSessionHas('warning');
        $this->assertStringContainsString('negatif', Payroll::where('karyawan_id', $kid)->value('peringatan'));
    }

    public function test_unique_payroll_per_karyawan_periode(): void
    {
        [, $kid] = $this->buatUser(6);
        $this->buatPayroll($kid, 'Draft', 1, 2026);

        $this->expectException(\Illuminate\Database\QueryException::class);
        $this->buatPayroll($kid, 'Draft', 1, 2026);
    }
}
