<?php

namespace App\Http\Controllers;

use App\Models\ItTicket;
use App\Models\RiwayatItTicket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image; // Pastikan package ini sudah diinstal

class ItTicketController extends Controller
{
    // [KARYAWAN] Menampilkan daftar tiket milik sendiri
    public function index(Request $request)
    {
        $user = $request->user();

        $tickets = ItTicket::where('user_id', $user->id)
            ->with('riwayats')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('ItTicket/Index', [
            'tickets' => $tickets
        ]);
    }

    // [KARYAWAN] Menyimpan tiket keluhan baru
    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:150',
            'modul' => 'required|string|max:100',
            'prioritas' => 'required|in:Rendah,Sedang,Tinggi,Darurat',
            'deskripsi' => 'required|string',
            'file_lampiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048', // Batas asli sebelum kompresi
        ]);

        $filePath = null;
        if ($request->hasFile('file_lampiran')) {
            $file = $request->file('file_lampiran');
            $extension = strtolower($file->getClientOriginalExtension());

            // Kompresi otomatis ke WebP HANYA jika file adalah gambar
            if (in_array($extension, ['jpg', 'jpeg', 'png'])) {
                $filename = 'it_tickets/' . uniqid() . '.webp';
                $image = Image::make($file)->encode('webp', 75); // Kualitas 75%
                
                Storage::disk('public')->put($filename, (string) $image);
                $filePath = $filename;
            } else {
                // Jika PDF, simpan normal tanpa kompresi
                $filePath = $file->store('it_tickets', 'public');
            }
        }

        $ticket = ItTicket::create([
            'user_id' => $request->user()->id,
            'judul' => $request->judul,
            'modul' => $request->modul,
            'prioritas' => $request->prioritas,
            'deskripsi' => $request->deskripsi,
            'file_lampiran' => $filePath,
            'status' => 'Pending',
            'persentase_progress' => 0,
        ]);

        // Catat entri awal ke tabel riwayat_it_tickets
        RiwayatItTicket::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'progress_sebelumnya' => 0,
            'progress_baru' => 0,
            'catatan' => 'Tiket kendala berhasil dibuat oleh pelapor.',
        ]);

        return redirect()->route('ticket.index')->with('success', 'Tiket kendala berhasil dilaporkan ke tim operasional.');
    }
// [ADMIN IT/GA] Menampilkan seluruh antrean tiket masuk
    public function adminIndex(Request $request)
    {
        $user = $request->user();
        $user->load('role', 'karyawan.departemen'); 

        $roleName = $user->role->nama_role ?? '';
        $deptKode = strtoupper($user->karyawan->departemen->kode_departemen ?? '');
        $deptName = strtolower($user->karyawan->departemen->nama_departemen ?? '');

        // 1. Cek Admin Sistem
        $isSistemAdmin = ($roleName === 'Admin');

        // 2. Cek Divisi Support (Gunakan pencocokan Kode / Frasa Lengkap)
        // DILARANG menggunakan str_contains($deptName, 'it') karena akan mencocokkan "Human CapITal" atau "AudIT"
        $allowedKodes = ['IT', 'GA']; 
        
        $isDivisiSupport = in_array($deptKode, $allowedKodes) || 
                           str_contains($deptName, 'information technology') || 
                           str_contains($deptName, 'teknologi informasi') || 
                           str_contains($deptName, 'general affair') || 
                           $deptName === 'it' || 
                           $deptName === 'ga';

        if (!$isSistemAdmin && !$isDivisiSupport) {
            abort(403, 'Akses Ditolak: Halaman ini khusus untuk Sistem Admin dan Departemen GA/IT.');
        }

        $tickets = ItTicket::with(['user.karyawan.departemen', 'riwayats'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('ItTicket/AdminIndex', [
            'tickets' => $tickets
        ]);
    }

    // [ADMIN IT/GA] Memperbarui progress & status penanganan tiket
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $user->load('role', 'karyawan.departemen');

        $roleName = $user->role->nama_role ?? '';
        $deptKode = strtoupper($user->karyawan->departemen->kode_departemen ?? '');
        $deptName = strtolower($user->karyawan->departemen->nama_departemen ?? '');

        $isSistemAdmin = ($roleName === 'Admin');
        $allowedKodes = ['IT', 'GA'];

        $isDivisiSupport = in_array($deptKode, $allowedKodes) || 
                           str_contains($deptName, 'information technology') || 
                           str_contains($deptName, 'teknologi informasi') || 
                           str_contains($deptName, 'general affair') || 
                           $deptName === 'it' || 
                           $deptName === 'ga';

        if (!$isSistemAdmin && !$isDivisiSupport) {
            abort(403, 'Akses Ditolak: Anda tidak berada di departemen yang berwenang mengeksekusi tiket ini.');
        }

        $request->validate([
            'status' => 'required|in:Pending,Diproses,Selesai,Ditolak',
            'persentase_progress' => 'required|integer|min:0|max:100',
            'catatan' => 'required|string|max:500',
        ]);

        $ticket = ItTicket::findOrFail($id);
        $progressLama = $ticket->persentase_progress;

        $ticket->update([
            'status' => $request->status,
            'persentase_progress' => $request->persentase_progress,
        ]);

        // Catat audit trail perbaikan
        RiwayatItTicket::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'progress_sebelumnya' => $progressLama,
            'progress_baru' => $request->persentase_progress,
            'catatan' => $request->catatan,
        ]);

        return redirect()->back()->with('success', 'Perkembangan tiket berhasil diperbarui.');
    }
}