<?php

namespace App\Http\Controllers;

use App\Models\ItTicket;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ItTicketController extends Controller
{
    // [KARYAWAN] Tampilkan daftar tiket saya
    public function index(Request $request)
    {
        $tickets = ItTicket::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('ItTicket/Index', [
            'tickets' => $tickets
        ]);
    }

    // [KARYAWAN] Simpan tiket baru
    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:150',
            'modul' => 'required|string|max:100',
            'deskripsi' => 'required|string',
            'prioritas' => 'nullable|string',
            'file_lampiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf,zip|max:5120', // Maks 5MB
        ]);

        $path = null;
        if ($request->hasFile('file_lampiran')) {
            $path = $request->file('file_lampiran')->store('tickets', 'public');
        }

        ItTicket::create([
            'user_id' => $request->user()->id,
            'judul' => $request->judul,
            'modul' => $request->modul,
            'deskripsi' => $request->deskripsi,
            'prioritas' => $request->prioritas ?? 'Medium',
            'status' => 'Submitted',
            'persentase_progress' => 0,
            'file_lampiran' => $path,
        ]);

        return redirect()->back()->with('success', 'Tiket berhasil dikirim ke tim IT.');
    }

    // [ADMIN] Tampilkan semua tiket masuk
    public function adminIndex()
    {
        $tickets = ItTicket::with('user')->orderBy('created_at', 'desc')->get();

        return Inertia::render('ItTicket/AdminIndex', [
            'tickets' => $tickets
        ]);
    }

    // [ADMIN] Update status dan progress tiket
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string',
            'persentase_progress' => 'required|integer|min:0|max:100',
        ]);

        $ticket = ItTicket::findOrFail($id);
        $ticket->update([
            'status' => $request->status,
            'persentase_progress' => $request->persentase_progress,
        ]);

        return redirect()->back()->with('success', 'Status tiket berhasil diperbarui.');
    }
}