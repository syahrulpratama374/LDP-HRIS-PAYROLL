import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";

export default function AdminIndex({ tickets }) {
    // State untuk menyimpan seluruh objek tiket yang dipilih (agar bisa membaca riwayatnya)
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form handler Inertia (TAMBAHAN: 'catatan' wajib ada karena diminta oleh Controller)
    const { data, setData, post, processing, reset, errors } = useForm({
        status: "",
        persentase_progress: 0,
        catatan: "",
    });

    // Fungsi membuka Modal dan mengisi data awal
    const openModal = (ticket) => {
        setSelectedTicket(ticket);
        setData({
            status: ticket.status !== 'Pending' ? ticket.status : 'Diproses', // Otomatis ubah ke Diproses jika baru disentuh
            persentase_progress: ticket.persentase_progress,
            catatan: "", // Kosongkan catatan setiap kali buka modal
        });
        setIsModalOpen(true);
    };

    // Fungsi menutup Modal
    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedTicket(null), 300); // Tunggu animasi tutup selesai
        reset();
    };

    // Fungsi Submit Form dari dalam Modal
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.ticket.update", selectedTicket.id), {
            onSuccess: () => closeModal(),
        });
    };

    // Helper Format Tanggal & Waktu
    const formatTanggal = (dateString) => {
        return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    };
    const formatWaktu = (dateString) => {
        return new Date(dateString).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Monitoring IT Helpdesk
                </h2>
            }
        >
            <Head title="Admin Helpdesk" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">Pelapor</th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">Detail Kendala</th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase w-1/4">Status & Progress</th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                Semua sistem aman. Belum ada keluhan.
                                            </td>
                                        </tr>
                                    ) : (
                                        tickets.map((t) => (
                                            <tr key={t.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm font-bold text-gray-800">{t.user?.name}</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {formatTanggal(t.created_at)} • {formatWaktu(t.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm font-bold text-gray-900 mb-1">
                                                        <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] uppercase text-white ${t.prioritas === 'Darurat' || t.prioritas === 'Tinggi' ? 'bg-red-600' : 'bg-gray-500'}`}>
                                                            {t.prioritas}
                                                        </span>
                                                        {t.judul}
                                                    </div>
                                                    <div className="text-xs font-semibold text-indigo-600">Kategori: {t.modul}</div>
                                                    <div className="text-xs text-gray-500 mt-1 italic truncate max-w-xs">"{t.deskripsi}"</div>
                                                    {t.file_lampiran && (
                                                        <a href={`/storage/${t.file_lampiran}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-2 inline-block font-semibold">
                                                            Lihat Lampiran 📎
                                                        </a>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold text-gray-700">{t.status}</span>
                                                        <span className="text-indigo-700 font-bold">{t.persentase_progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${t.persentase_progress === 100 ? "bg-green-500" : "bg-indigo-600"}`}
                                                            style={{ width: `${t.persentase_progress}%` }}
                                                        ></div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <button
                                                        onClick={() => openModal(t)}
                                                        className="bg-gray-800 hover:bg-black text-white text-xs font-bold py-2 px-4 rounded shadow transition"
                                                    >
                                                        Tindak Lanjut
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* KOMPONEN MODAL OVERLAY (Wider layout with Timeline) */}
            {isModalOpen && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden transform transition-all max-h-[90vh]">
                        
                        {/* KIRI: Detail & Timeline Riwayat */}
                        <div className="flex-1 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
                            <h3 className="text-lg font-bold text-gray-900">{selectedTicket.judul}</h3>
                            <p className="text-sm text-gray-600 mt-2 bg-white p-3 rounded-lg border border-gray-200">
                                {selectedTicket.deskripsi}
                            </p>

                            <h4 className="text-sm font-bold text-gray-500 uppercase mt-6 mb-4">Timeline Pengerjaan</h4>
                            <div className="relative border-l-2 border-indigo-200 pl-4 ml-2">
                                {selectedTicket.riwayats?.map((riwayat, index) => (
                                    <div key={index} className="mb-5 relative">
                                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-indigo-500 border-2 border-white" />
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                            {formatWaktu(riwayat.created_at)}
                                            <span className="rounded bg-indigo-100 text-indigo-800 px-1.5 py-0.5 text-[10px]">
                                                Progres: {riwayat.progress_sebelumnya}% ➔ {riwayat.progress_baru}%
                                            </span>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100 shadow-sm">
                                            {riwayat.catatan}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* KANAN: Form Update */}
                        <div className="w-full md:w-[400px] p-6 flex flex-col">
                            <div className="flex justify-between items-center mb-6 border-b pb-3">
                                <h3 className="text-lg font-bold text-gray-900">Update Tiket</h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 font-bold text-xl">&times;</button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Status Kendala</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData("status", e.target.value)}
                                        className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        <option value="Pending">Pending (Menunggu)</option>
                                        <option value="Diproses">Diproses (Sedang Dikerjakan)</option>
                                        <option value="Selesai">Selesai (Sudah Diperbaiki)</option>
                                        <option value="Ditolak">Ditolak (Tidak Valid)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                                        <span>Progres Pengerjaan</span>
                                        <span className="text-indigo-600">{data.persentase_progress}%</span>
                                    </label>
                                    <input
                                        type="range" min="0" max="100" step="5"
                                        value={data.persentase_progress}
                                        onChange={(e) => setData("persentase_progress", e.target.value)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                {/* INPUT CATATAN - WAJIB ADA AGAR CONTROLLER TIDAK ERROR 422 */}
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        Catatan Teknisi <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows="4"
                                        required
                                        value={data.catatan}
                                        onChange={(e) => setData("catatan", e.target.value)}
                                        placeholder="Tuliskan apa yang sudah dikerjakan..."
                                        className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-none"
                                    />
                                    {errors.catatan && <span className="text-xs text-red-500 mt-1">{errors.catatan}</span>}
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-bold text-sm hover:bg-gray-200 transition">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={processing} className="px-4 py-2 bg-indigo-600 text-white rounded-md font-bold text-sm hover:bg-indigo-700 shadow transition disabled:opacity-50">
                                        {processing ? "Menyimpan..." : "Simpan Update"}
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}