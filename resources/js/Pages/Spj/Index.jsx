import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Index({ spj, adaUtangLaporan }) {
    // State untuk mengontrol Modal Pelaporan Pasca-SPJ
    const [showModal, setShowModal] = useState(false);
    const [selectedSpjId, setSelectedSpjId] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        laporan_hasil: "",
        file_bukti: null,
    });

    const openModal = (id) => {
        setSelectedSpjId(id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedSpjId(null);
        reset();
    };

    const submitLaporan = (e) => {
        e.preventDefault();
        post(route("spj.laporan", selectedSpjId), {
            forceFormData: true,
            onSuccess: () => closeModal(),
        });
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
                                                    <div className="text-sm text-gray-600">
                                                        {item.keperluan}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    {new Date(
                                                        item.tgl_mulai,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}{" "}
                                                    -{" "}
                                                    {new Date(
                                                        item.tgl_selesai,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 border-b text-sm font-bold text-green-600">
                                                    Rp{" "}
                                                    {Number(
                                                        item.total_biaya,
                                                    ).toLocaleString("id-ID")}
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${
                                                            item.status_approval ===
                                                            "Pending"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : item.status_approval ===
                                                                    "Disetujui"
                                                                  ? "bg-blue-100 text-blue-800"
                                                                  : item.status_approval ===
                                                                      "Menunggu Pelaporan"
                                                                    ? "bg-orange-100 text-orange-800"
                                                                    : item.status_approval ===
                                                                        "Menunggu Validasi Finance"
                                                                      ? "bg-purple-100 text-purple-800"
                                                                      : item.status_approval ===
                                                                          "Selesai"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {item.status_approval}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-b text-center">
                                                    {item.status_approval ===
                                                        "Menunggu Pelaporan" && (
                                                        <button
                                                            onClick={() =>
                                                                openModal(
                                                                    item.id,
                                                                )
                                                            }
                                                            className="text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded text-xs font-bold shadow"
                                                        >
                                                            Lapor Sekarang
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

            {/* Modal Pelaporan Pasca-SPJ */}
            {showModal && (
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
                                    onChange={(e) =>
                                        setData("laporan_hasil", e.target.value)
                                    }
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    placeholder="Ketikkan kesimpulan dan hasil perjalanan dinas di sini..."
                                    required
                                ></textarea>
                                {errors.laporan_hasil && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.laporan_hasil}
                                    </div>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unggah Bukti Bon / Nota (Foto/PDF)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setData("file_bukti", e.target.files[0])
                                    }
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    required
                                />
                                {errors.file_bukti && (
                                    <div className="text-red-500 text-xs mt-1">
                                        {errors.file_bukti}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
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
