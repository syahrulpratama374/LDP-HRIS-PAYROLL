<?php

namespace App\Http\Controllers;

use App\Models\Aset;
use App\Models\Karyawan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AsetController extends Controller
{
    // [ADMIN / GA] Menampilkan Dasbor Manajemen Aset
    public function index(Request $request)
    {
        $query = Aset::with('penanggungJawab.departemen')->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('nama_aset', 'like', "%{$search}%")
                  ->orWhere('kode_aset', 'like', "%{$search}%");
        }

        $asets = $query->paginate(15)->withQueryString();

        return Inertia::render('Aset/Index', [
            'asets' => $asets,
            'filters' => $request->only('search')
        ]);
    }

    // [ADMIN / GA] Menampilkan Form Tambah Aset
    public function create()
    {
        $karyawans = Karyawan::with('departemen')->where('status_aktif', true)->get();
        
        return Inertia::render('Aset/Create', [
            'karyawans' => $karyawans
        ]);
    }

    // [ADMIN / GA] Menyimpan Aset & Mencetak QR Code Otomatis
   // [ADMIN / GA] Menyimpan Aset & Mencetak QR Code Otomatis
    public function store(Request $request)
    {
        $request->validate([
            'nama_aset' => 'required|string|max:150',
            'kategori' => 'required|in:Elektronik,Kendaraan,Furniture,Lisensi',
            'tgl_beli' => 'nullable|date',
            'harga_beli' => 'nullable|numeric|min:0',
            'tgl_expired_pajak' => 'nullable|date',
            'penanggung_jawab_id' => 'nullable|exists:karyawans,id',
            'status' => 'required|in:Tersedia,Dipakai,Rusak,Maintenance',
        ]);

        $tahun = date('Y');
        $lastAset = Aset::whereYear('created_at', $tahun)->latest('id')->first();
        $urutan = $lastAset ? ($lastAset->id + 1) : 1;
        $kodeAset = 'AST-' . $tahun . '-' . str_pad($urutan, 4, '0', STR_PAD_LEFT);

        $aset = Aset::create(array_merge($request->all(), [
            'kode_aset' => $kodeAset,
        ]));

        // --- PERUBAHAN DI SINI: MENCETAK LINK URL BUKAN TEKS MENTAH ---
        // Kita mencetak URL route 'aset.scan' ke dalam QR Code
        $qrContent = route('aset.scan', $kodeAset);
        
        $qrFileName = 'qr_codes/' . $kodeAset . '.svg';
        
        $qrImage = \SimpleSoftwareIO\QrCode\Facades\QrCode::size(300)->generate($qrContent);
        \Illuminate\Support\Facades\Storage::disk('public')->put($qrFileName, $qrImage);

        $aset->update(['qr_code_path' => $qrFileName]);

        return redirect()->route('admin.aset.index')->with('success', 'Aset baru berhasil dicatat dan QR Code telah diterbitkan!');
    }

    // [PUBLIK] Halaman yang terbuka saat QR Code di-scan menggunakan HP
    public function showPublic($kode_aset)
    {
        $aset = Aset::with('penanggungJawab.departemen')->where('kode_aset', $kode_aset)->firstOrFail();

        return Inertia::render('Aset/Scan', [
            'aset' => $aset
        ]);
    }

}