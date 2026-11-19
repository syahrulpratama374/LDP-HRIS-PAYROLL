<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\Karyawan;
use App\Models\MasterTarifSpj;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Master Tarif SPJ & kategori tarif per karyawan.
 * Melihat: Admin, HC, Finance (lewat menu). Mengubah: hanya Admin & HC.
 */
class MasterTarifSpjController extends Controller
{
    private const ROLE_PENGUBAH = [1, 3];

    public function index(Request $request)
    {
        $karyawans = Karyawan::with(['jabatan:id,kode_jabatan,nama_jabatan', 'departemen:id,kode_departemen,nama_departemen'])
            ->where('status_aktif', true)
            ->orderBy('nama_lengkap')
            ->get(['id', 'nama_lengkap', 'nik_internal', 'jabatan_id', 'departemen_id', 'kategori_tarif_spj']);

        return Inertia::render('MasterData/TarifSpj/Index', [
            'tarifs' => MasterTarifSpj::orderBy('provinsi')->orderByDesc('berlaku_mulai')->get(),
            'karyawans' => $karyawans,
            'kategoriList' => MasterTarifSpj::KATEGORI,
            'bolehUbah' => in_array($request->user()->role_id, self::ROLE_PENGUBAH, true),
        ]);
    }

    public function store(Request $request)
    {
        $this->pastikanBolehUbah($request);
        $tarif = MasterTarifSpj::create($this->validasi($request) + ['satuan' => 'OH']);
        $this->audit($request, 'Tambah tarif SPJ', null, $tarif->toArray());

        return redirect()->back()->with('success', 'Tarif SPJ berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $this->pastikanBolehUbah($request);
        $tarif = MasterTarifSpj::findOrFail($id);
        $lama = $tarif->toArray();
        $tarif->update($this->validasi($request, $tarif->id));
        $this->audit($request, 'Ubah tarif SPJ', $lama, $tarif->fresh()->toArray());

        return redirect()->back()->with('success', 'Tarif SPJ berhasil diperbarui.');
    }

    public function destroy(Request $request, $id)
    {
        $this->pastikanBolehUbah($request);
        $tarif = MasterTarifSpj::findOrFail($id);
        $this->audit($request, 'Hapus tarif SPJ', $tarif->toArray(), null);
        $tarif->delete();

        return redirect()->back()->with('success', 'Tarif SPJ berhasil dihapus.');
    }

    /** Ubah kategori tarif SPJ satu karyawan. */
    public function updateKategori(Request $request, Karyawan $karyawan)
    {
        $this->pastikanBolehUbah($request);
        $data = $request->validate(['kategori_tarif_spj' => ['required', Rule::in(MasterTarifSpj::KATEGORI)]]);

        $lama = $karyawan->kategori_tarif_spj;
        $karyawan->update($data);
        $this->audit($request, 'Ubah kategori tarif SPJ',
            ['karyawan' => $karyawan->nama_lengkap, 'kategori_tarif_spj' => $lama],
            ['karyawan' => $karyawan->nama_lengkap] + $data);

        return redirect()->back()->with('success', "Kategori tarif {$karyawan->nama_lengkap} menjadi {$data['kategori_tarif_spj']}.");
    }

    private function validasi(Request $request, ?int $kecualiId = null): array
    {
        $data = $request->validate([
            'provinsi' => 'required|string|max:100',
            'jenis' => ['required', Rule::in(MasterTarifSpj::JENIS)],
            'kategori' => ['required', Rule::in(MasterTarifSpj::KATEGORI)],
            'nominal' => 'required|numeric|min:0',
            'berlaku_mulai' => 'required|date_format:Y-m-d',
        ]);
        $data['provinsi'] = trim($data['provinsi']);

        $duplikat = MasterTarifSpj::where('provinsi', $data['provinsi'])->where('jenis', $data['jenis'])
            ->where('kategori', $data['kategori'])->where('berlaku_mulai', $data['berlaku_mulai'])
            ->when($kecualiId, fn ($q) => $q->where('id', '!=', $kecualiId))
            ->exists();
        if ($duplikat) {
            throw ValidationException::withMessages([
                'berlaku_mulai' => 'Tarif untuk provinsi, jenis, kategori, dan tanggal berlaku ini sudah ada. Ubah baris yang ada atau pakai tanggal berlaku lain.',
            ]);
        }

        return $data;
    }

    private function pastikanBolehUbah(Request $request): void
    {
        abort_unless(in_array($request->user()->role_id, self::ROLE_PENGUBAH, true), 403,
            'Hanya HC dan Admin yang dapat mengubah tarif SPJ.');
    }

    private function audit(Request $request, string $aksi, ?array $lama, ?array $baru): void
    {
        AuditTrail::create([
            'user_id' => $request->user()->id,
            'modul' => 'Master Tarif SPJ',
            'aksi' => Str::limit($aksi, 50, ''), // kolom aksi varchar(50)
            'data_lama' => $lama === null ? null : json_encode($lama),
            'data_baru' => $baru === null ? null : json_encode($baru),
            'waktu' => now(),
        ]);
    }
}
