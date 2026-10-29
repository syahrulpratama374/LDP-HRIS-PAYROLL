import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage, useForm } from "@inertiajs/react";

export default function AdminIndex({ pinjaman = [], userRole }) {
    const { flash, errors } = usePage().props;
    const [selectedCicilan, setSelectedCicilan] = useState(null);

    const formBayar = useForm({
        bukti_transfer: null,
    });

    const handleAction = (id, status) => {
        let confirmText = "Apakah Anda yakin?";
        if (status === "Berjalan")
            confirmText =
                "Setujui dan Cairkan dana kasbon ini? Sistem akan otomatis membuat jadwal pemotongan gaji.";
        if (status === "Ditolak")
            confirmText = "Tolak pengajuan kasbon ini secara permanen?";

        if (confirm(confirmText)) {
            router.post(
                route("admin.pinjaman.update", id),
                { status: status },
                { preserveScroll: true },
            );
        }
    };

    const handleOpenBayarModal = (pinjam) => {
        // Ambil cicilan pertama yang belum lunas
        const cicilanBelumLunas = pinjam.cicilans?.find(
            (c) => c.status_bayar === "Belum Lunas",
        );
        if (cicilanBelumLunas) {
            setSelectedCicilan({
                ...cicilanBelumLunas,
                karyawan: pinjam.karyawan,
            });
        } else {
            alert("Seluruh cicilan pinjaman ini sudah lunas!");
        }
    };

    const submitBayarManual = (e) => {
        e.preventDefault();
        if (!selectedCicilan) return;

        formBayar.post(
            route("admin.pinjaman.bayarManual", selectedCicilan.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedCicilan(null);
                    formBayar.reset();
                },
            },
        );
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka || 0);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Approval & Kelola Kasbon Karyawan
                </h2>
            }
        >
            <Head title="Approval Kasbon" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-4">
                    {/* FLASH NOTIFICATION */}
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative shadow-sm text-sm font-semibold">
                            ✓ {flash.success}
                        </div>
                    )}
                    {errors?.error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative shadow-sm text-sm font-semibold">
                            ⚠️ {errors.error}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Karyawan & Sumber Dana
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tgl & Keperluan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Total & Tenor
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Sisa Hutang
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
                                    {pinjaman.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-8 text-center text-gray-500 text-sm"
                                            >
                                                Belum ada pengajuan kasbon.
                                            </td>
                                        </tr>
                                    ) : (
                                        pinjaman.map((p) => (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                {/* KARYAWAN & SUMBER DANA */}
                                                <td className="px-6 py-4 border-b">
                                                    <div className="text-sm font-bold text-gray-800">
                                                        {p.karyawan
                                                            ?.nama_lengkap ||
                                                            "Tidak Diketahui"}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        {p.karyawan?.departemen
                                                            ?.nama_departemen ||
                                                            "-"}
                                                    </div>
                                                    <span
                                                        className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded ${
                                                            p.jenis_kasbon ===
                                                            "Divisi"
                                                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                                                : "bg-blue-100 text-blue-800 border border-blue-200"
                                                        }`}
                                                    >
                                                        Kas{" "}
                                                        {p.jenis_kasbon ||
                                                            "Finance"}
                                                    </span>
                                                </td>

                                                {/* TANGGAL & ALASAN */}
                                                <td className="px-6 py-4 border-b text-sm text-gray-700">
                                                    <div className="font-semibold text-xs text-gray-500">
                                                        {new Date(
                                                            p.created_at,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-700 italic mt-0.5 max-w-xs truncate">
                                                        "
                                                        {p.alasan_pinjaman ||
                                                            "-"}
                                                        "
                                                    </p>
                                                </td>

                                                {/* TOTAL & TENOR */}
                                                <td className="px-6 py-4 border-b text-sm text-gray-800">
                                                    <span className="font-bold text-indigo-600">
                                                        {formatRupiah(
                                                            p.total_pinjaman,
                                                        )}
                                                    </span>
                                                    <br />
                                                    <span className="text-xs text-gray-500">
                                                        {p.tenor_bulan} Bulan
                                                        Cicilan
                                                    </span>
                                                </td>

                                                {/* SISA HUTANG */}
                                                <td className="px-6 py-4 border-b text-sm text-red-600 font-semibold">
                                                    {formatRupiah(
                                                        p.sisa_pinjaman,
                                                    )}
                                                </td>

                                                {/* STATUS */}
                                                <td className="px-6 py-4 border-b text-center">
                                                    <span
                                                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            p.status ===
                                                            "Pending"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : p.status ===
                                                                    "Berjalan"
                                                                  ? "bg-blue-100 text-blue-800"
                                                                  : p.status ===
                                                                      "Lunas"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {p.status}
                                                    </span>
                                                </td>

                                                {/* AKSI */}
                                                <td className="px-6 py-4 border-b text-center">
                                                    <div className="flex justify-center items-center space-x-2">
                                                        {p.status ===
                                                            "Pending" && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleAction(
                                                                            p.id,
                                                                            "Berjalan",
                                                                        )
                                                                    }
                                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition"
                                                                >
                                                                    Setujui &
                                                                    Cairkan
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleAction(
                                                                            p.id,
                                                                            "Ditolak",
                                                                        )
                                                                    }
                                                                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition"
                                                                >
                                                                    Tolak
                                                                </button>
                                                            </>
                                                        )}

                                                        {p.status ===
                                                            "Berjalan" && (
                                                            <button
                                                                onClick={() =>
                                                                    handleOpenBayarModal(
                                                                        p,
                                                                    )
                                                                }
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition"
                                                            >
                                                                Pelunasan Manual
                                                            </button>
                                                        )}

                                                        {[
                                                            "Lunas",
                                                            "Ditolak",
                                                        ].includes(
                                                            p.status,
                                                        ) && (
                                                            <span className="text-xs text-gray-400 italic">
                                                                Selesai
                                                            </span>
                                                        )}
                                                    </div>
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

            {/* MODAL PELUNASAN MANUAL */}
            {selectedCicilan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
                        <div className="bg-[#2A164E] px-5 py-4 text-white">
                            <h3 className="font-bold text-base">
                                Input Pelunasan Manual
                            </h3>
                            <p className="text-xs text-gray-300">
                                Karyawan:{" "}
                                {selectedCicilan.karyawan?.nama_lengkap}
                            </p>
                        </div>

                        <form
                            onSubmit={submitBayarManual}
                            className="p-5 space-y-4"
                        >
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <p className="text-xs text-gray-500 uppercase font-bold">
                                    Nominal Angsuran
                                </p>
                                <p className="text-lg font-extrabold text-[#2A164E]">
                                    {formatRupiah(
                                        selectedCicilan.nominal_cicilan,
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                                    Upload Bukti Transfer / Tunai{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={(e) =>
                                        formBayar.setData(
                                            "bukti_transfer",
                                            e.target.files[0],
                                        )
                                    }
                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#2A164E] file:text-white hover:file:bg-[#431D6D]"
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCicilan(null)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formBayar.processing}
                                    className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {formBayar.processing
                                        ? "Menyimpan..."
                                        : "Konfirmasi Lunas"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
