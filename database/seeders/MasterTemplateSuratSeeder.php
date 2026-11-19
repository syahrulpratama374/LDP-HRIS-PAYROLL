<?php

namespace Database\Seeders;

use App\Models\Jabatan;
use App\Models\MasterTemplateSurat;
use App\Models\Role;
use App\Models\RuteApprovalTemplate;
use Illuminate\Database\Seeder;

/**
 * Jenis surat perusahaan (master_template_surats). Aman diulang dan TIDAK menimpa:
 * - Ganti kode lama SKK -> SKET dan ST -> STU hanya bila kode lama ada dan kode baru belum ada.
 *   Yang diubah hanya kolom kode_surat (id, nama, konten, rute approval tetap); dicatat di output.
 *   Nomor surat yang sudah terbit dengan kode lama tidak diubah (nomor historis).
 * - Jenis lain hanya dibuat bila kodenya belum ada; baris yang sudah ada tidak disentuh.
 */
class MasterTemplateSuratSeeder extends Seeder
{
    public const GANTI_KODE = ['SKK' => 'SKET', 'ST' => 'STU'];

    /** kode => nama jenis surat */
    public const JENIS = [
        'SP' => 'Surat Pernyataan',
        'SKEP' => 'Surat Keputusan',
        'SK' => 'Surat Kuasa',
        'SM' => 'Surat Permohonan',
        'SKET' => 'Surat Keterangan',
        'STU' => 'Surat Tugas',
        'PKS' => 'Perjanjian Kerja Sama (Umum)',
        'PKS-IPR' => 'Perjanjian Kerja Sama Iprime',
        'PKS-CUST' => 'Perjanjian Kerja Sama Customer',
        'BA' => 'Berita Acara',
        'BAKES' => 'Berita Acara Kesepakatan',
        'SE' => 'Surat Edaran',
        'SPK' => 'Surat Pengalaman Kerja',
        'SPH' => 'Surat Perjanjian Hibah',
        'SPJ-PD' => 'SPJ Biaya Perjalanan Dinas',
    ];

    /** Jenis bergaya judul tengah (gaya A); sisanya blok_nomor. Hanya dipakai saat membuat baris baru. */
    public const JUDUL_TENGAH = [
        'SPJ-PD', 'SK', 'SKEP', 'SKET', 'STU', 'SP', 'SE',
        'PKS', 'PKS-IPR', 'PKS-CUST', 'BA', 'BAKES', 'SPK', 'SPH',
    ];

    public function run(): void
    {
        foreach (self::GANTI_KODE as $lama => $baru) {
            $templateLama = $this->cari($lama);
            if (! $templateLama) {
                continue;
            }
            if ($this->cari($baru)) {
                $this->command?->warn("Kode {$lama} dan {$baru} sama-sama ada; tidak ada yang diubah.");

                continue;
            }
            $templateLama->update(['kode_surat' => $baru]);
            $this->command?->warn("Kode jenis surat diganti: {$lama} -> {$baru} (id {$templateLama->id}, isi tetap).");
        }

        foreach (self::JENIS as $kode => $nama) {
            if ($this->cari($kode)) {
                continue;
            }
            MasterTemplateSurat::create([
                'kode_surat' => $kode,
                'nama_template' => $nama,
                'konten' => '<p>[Isi '.e($nama).']</p>',
                'gaya_kepala' => in_array($kode, self::JUDUL_TENGAH, true)
                    ? MasterTemplateSurat::GAYA_JUDUL_TENGAH
                    : MasterTemplateSurat::GAYA_BLOK_NOMOR,
                'is_active' => true,
            ]);
        }

        $this->isiRuteSpjPd();
    }

    /**
     * Rute SPJ-PD (HC -> Finance -> Direktur) untuk instalasi baru; hanya bila template belum punya
     * rute, jadi rute yang sudah diatur HC tidak ditimpa. DB lama diisi lewat migrasi data.
     */
    private function isiRuteSpjPd(): void
    {
        $template = $this->cari('SPJ-PD');
        $jabatanCeo = Jabatan::where('kode_jabatan', 'CEO')->value('id');
        if (! $template || ! $jabatanCeo || Role::whereIn('id', [3, 4])->count() < 2 || $template->ruteApprovals()->exists()) {
            return;
        }

        foreach ([
            [1, RuteApprovalTemplate::TIPE_ROLE, 3, null, 'Diajukan Oleh'],
            [2, RuteApprovalTemplate::TIPE_ROLE, 4, null, 'Diperiksa Oleh'],
            [3, RuteApprovalTemplate::TIPE_JABATAN, null, $jabatanCeo, 'Disetujui Oleh'],
        ] as [$urutan, $tipe, $roleId, $jabatanId, $label]) {
            RuteApprovalTemplate::create([
                'template_id' => $template->id, 'urutan_langkah' => $urutan, 'tipe_penyetuju' => $tipe,
                'role_id' => $roleId, 'jabatan_id' => $jabatanId, 'label_ttd' => $label,
            ]);
        }
    }

    /** Cari tanpa membedakan huruf besar/kecil (SQLite case-sensitive, MySQL tidak). */
    private function cari(string $kode): ?MasterTemplateSurat
    {
        return MasterTemplateSurat::whereRaw('UPPER(kode_surat) = ?', [strtoupper($kode)])->orderBy('id')->first();
    }
}
