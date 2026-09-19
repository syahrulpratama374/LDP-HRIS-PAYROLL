import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Index({ spj, adaUtangLaporan }) {
    // State untuk Laporan
    const [showModalLapor, setShowModalLapor] = useState(false);
    const [selectedSpjId, setSelectedSpjId] = useState(null);

    // State untuk Detail Modal
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        laporan_hasil: "",
        file_bukti: null,
    });

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka);
    };

    // Fungsi Lapor
    const openModalLapor = (id) => {
        setSelectedSpjId(id);
        setShowModalLapor(true);
    };

    const closeModalLapor = () => {
        setShowModalLapor(false);
        setSelectedSpjId(null);
        reset();
    };

    const submitLaporan = (e) => {
        e.preventDefault();
        post(route("spj.laporan", selectedSpjId), {
            forceFormData: true,
            onSuccess: () => closeModalLapor(),
        });
    };

    // Fungsi Detail
    const openDetailModal = (item) => {
        setSelectedDetail(item);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedDetail(null);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Riwayat Perjalanan Dinas (SPJ)
                </h2>
            }
        >
            <Head title="SPJ Karyawan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Banner Peringatan Jika Ada Utang Laporan */}
                    {adaUtangLaporan && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
                            <p className="font-bold text-lg">
                                Akses Pengajuan Baru Dikunci!
                            </p>
                            <p>
                                Anda memiliki jadwal perjalanan dinas yang sudah
                                selesai namun belum dilaporkan. Harap unggah
                                laporan hasil dan bukti bon pada tabel di bawah
                                agar Anda dapat membuat pengajuan SPJ baru.
                            </p>
                        </div>
                    )}

                    <div className="mb-6 flex justify-end">
                        {/* Auto-Lock Tombol Pengajuan */}
                        {!adaUtangLaporan ? (
                            <Link
                                href={route("spj.create")}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-all"
                            >
                                + Buat Pengajuan SPJ
                            </Link>
                        ) : (
                            <button
                                disabled
                                className="bg-gray-400 text-white font-bold py-2 px-4 rounded-lg shadow cursor-not-allowed"
                            >
                                + Buat Pengajuan SPJ (Terkunci)
                            </button>
                        )}
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tujuan & Keperluan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Total Biaya
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {spj.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada riwayat SPJ.
                                            </td>
                                        </tr>
                                    ) : (
                                        spj.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 border-b">
                                                    <div className="font-bold text-gray-800">
                                                        {item.tujuan}
                                                    </div>
                                                    <div className="text-sm text-gray-600 truncate max-w-xs">
                                                        {item.keperluan}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {new Date(item.tgl_mulai).toLocaleDateString("id-ID")} -{" "}
                                                    {new Date(item.tgl_selesai).toLocaleDateString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm font-bold text-green-600">
                                                    {formatRupiah(item.total_biaya)}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${
                                                            item.status_approval === "Pending"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : item.status_approval === "Disetujui"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : item.status_approval === "Menunggu Pelaporan"
                                                                ? "bg-orange-100 text-orange-800"
                                                                : item.status_approval === "Menunggu Validasi Finance"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : item.status_approval === "Selesai"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {item.status_approval}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b text-center space-x-2">
                                                    {/* TOMBOL DETAIL DITAMBAHKAN DI SINI */}
                                                    <button
                                                        onClick={() => openDetailModal(item)}
                                                        className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-xs font-bold shadow"
                                                    >
                                                        Detail
                                                    </button>

                                                    {item.status_approval === "Menunggu Pelaporan" && (
                                                        <button
                                                            onClick={() => openModalLapor(item.id)}
                                                            className="text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded text-xs font-bold shadow"
                                                        >
                                                            Lapor
                                                        </button>
                                                    )}
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

            {/* Modal Detail SPJ */}
            {showDetailModal && selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Rincian Perjalanan Dinas
                            </h3>
                            <button onClick={closeDetailModal} className="text-gray-500 hover:text-red-500 font-bold text-xl">
                                &times;
                            </button>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="block text-gray-500 font-medium">Tujuan:</span>
                                <span className="font-bold text-gray-900">{selectedDetail.tujuan}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 font-medium">Keperluan:</span>
                                <span className="text-gray-800">{selectedDetail.keperluan}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-gray-500 font-medium">Tanggal Mulai:</span>
                                    <span className="text-gray-800">{new Date(selectedDetail.tgl_mulai).toLocaleDateString("id-ID")}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 font-medium">Tanggal Selesai:</span>
                                    <span className="text-gray-800">{new Date(selectedDetail.tgl_selesai).toLocaleDateString("id-ID")}</span>
                                </div>
                            </div>
                            <div className="bg-green-50 p-3 rounded border border-green-100">
                                <span className="block text-green-700 font-medium">Total Anggaran SPJ:</span>
                                <span className="text-xl font-bold text-green-700">{formatRupiah(selectedDetail.total_biaya)}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 font-medium">Status Saat Ini:</span>
                                <span className="font-bold text-indigo-600">{selectedDetail.status_approval}</span>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={closeDetailModal}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pelaporan Pasca-SPJ */}
            {showModalLapor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                            Laporan Hasil Perjalanan Dinas
                        </h3>
                        <form onSubmit={submitLaporan}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hasil Kunjungan / Evaluasi Pekerjaan
                                </label>
                                <textarea
                                    rows="4"
                                    value={data.laporan_hasil}
                                    onChange={(e) => setData("laporan_hasil", e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    placeholder="Ketikkan kesimpulan dan hasil perjalanan dinas di sini..."
                                    required
                                ></textarea>
                                {errors.laporan_hasil && (
                                    <div className="text-red-500 text-xs mt-1">{errors.laporan_hasil}</div>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unggah Bukti Bon / Nota (Foto/PDF)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setData("file_bukti", e.target.files[0])}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    required
                                />
                                {errors.file_bukti && (
                                    <div className="text-red-500 text-xs mt-1">{errors.file_bukti}</div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModalLapor}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Kirim Laporan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}