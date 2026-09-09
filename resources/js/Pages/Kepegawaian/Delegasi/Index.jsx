import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";

export default function Index({ auth, delegasis, karyawans }) {
    // Mengecek apakah user adalah Admin/HC (Role 1 & 3) atau Supervisor (Role 5)
    const isAdmin = auth.user.role_id !== 5;

    const { data, setData, post, processing, errors, reset } = useForm({
        pemberi_id: "",
        penerima_id: "",
        tgl_mulai: "",
        tgl_selesai: "",
        alasan: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("admin.delegasi.store"), {
            preserveScroll: true,
            onSuccess: () =>
                reset("tgl_mulai", "tgl_selesai", "alasan", "penerima_id"),
        });
    };

    const handleToggleStatus = (id) => {
        if (confirm("Apakah Anda yakin ingin mengubah status delegasi ini?")) {
            router.patch(
                route("admin.delegasi.status", id),
                {},
                { preserveScroll: true },
            );
        }
    };

    const handleDelete = (id) => {
        if (
            confirm(
                "Apakah Anda yakin ingin menghapus arsip delegasi ini secara permanen?",
            )
        ) {
            router.delete(route("admin.delegasi.destroy", id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Delegasi Wewenang (Plt/Pjs)
                </h2>
            }
        >
            <Head title="Delegasi Wewenang" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Pesan Error Global (Misal: Bentrok Tanggal) */}
                    {errors.error && (
                        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 font-medium">
                            ⚠️ {errors.error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* KIRI: FORMULIR DELEGASI */}
                        <div className="md:col-span-1 bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 h-fit border-t-4 border-indigo-500">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                Buat Delegasi Baru
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Hanya tampil untuk Admin/HC yang bisa mengatur delegasi orang lain */}
                                {isAdmin && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Atasan yang Cuti (Pemberi)
                                        </label>
                                        <select
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                            value={data.pemberi_id}
                                            onChange={(e) =>
                                                setData(
                                                    "pemberi_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                -- Pilih Pemberi Wewenang --
                                            </option>
                                            {karyawans.map((k) => (
                                                <option key={k.id} value={k.id}>
                                                    {k.nama_lengkap}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.pemberi_id && (
                                            <span className="text-red-500 text-xs">
                                                {errors.pemberi_id}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Atasan Pengganti (Plt/Pjs)
                                    </label>
                                    <select
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                        value={data.penerima_id}
                                        onChange={(e) =>
                                            setData(
                                                "penerima_id",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    >
                                        <option value="">
                                            -- Pilih Rekan Pengganti --
                                        </option>
                                        {karyawans.map((k) => (
                                            <option key={k.id} value={k.id}>
                                                {k.nama_lengkap}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.penerima_id && (
                                        <span className="text-red-500 text-xs">
                                            {errors.penerima_id}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Tanggal Mulai
                                        </label>
                                        <input
                                            type="date"
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                            value={data.tgl_mulai}
                                            onChange={(e) =>
                                                setData(
                                                    "tgl_mulai",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        {errors.tgl_mulai && (
                                            <span className="text-red-500 text-xs">
                                                {errors.tgl_mulai}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Tanggal Selesai
                                        </label>
                                        <input
                                            type="date"
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                            value={data.tgl_selesai}
                                            onChange={(e) =>
                                                setData(
                                                    "tgl_selesai",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        {errors.tgl_selesai && (
                                            <span className="text-red-500 text-xs">
                                                {errors.tgl_selesai}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Alasan Pendelegasian
                                    </label>
                                    <textarea
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                        rows="3"
                                        placeholder="Cth: Cuti Tahunan..."
                                        value={data.alasan}
                                        onChange={(e) =>
                                            setData("alasan", e.target.value)
                                        }
                                        required
                                    ></textarea>
                                    {errors.alasan && (
                                        <span className="text-red-500 text-xs">
                                            {errors.alasan}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition disabled:opacity-50"
                                >
                                    {processing
                                        ? "Menyimpan..."
                                        : "Aktifkan Delegasi"}
                                </button>
                            </form>
                        </div>

                        {/* KANAN: TABEL RIWAYAT DELEGASI */}
                        <div className="md:col-span-2 bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                Riwayat Delegasi Anda
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {isAdmin && (
                                                <th className="px-4 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Pemberi
                                                </th>
                                            )}
                                            <th className="px-4 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                                Plt/Pjs Pengganti
                                            </th>
                                            <th className="px-4 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                                Rentang Tanggal
                                            </th>
                                            <th className="px-4 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {delegasis.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={isAdmin ? 5 : 4}
                                                    className="px-4 py-8 text-center text-gray-500"
                                                >
                                                    Belum ada riwayat
                                                    pendelegasian wewenang.
                                                </td>
                                            </tr>
                                        ) : (
                                            delegasis.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-gray-50 transition"
                                                >
                                                    {isAdmin && (
                                                        <td className="px-4 py-3 border-b text-sm font-semibold text-gray-800">
                                                            {
                                                                item.pemberi
                                                                    ?.nama_lengkap
                                                            }
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 border-b">
                                                        <div className="text-sm font-bold text-gray-800">
                                                            {
                                                                item.penerima
                                                                    ?.nama_lengkap
                                                            }
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {item.alasan}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 border-b text-sm text-gray-700">
                                                        {new Date(
                                                            item.tgl_mulai,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}{" "}
                                                        <br />
                                                        <span className="text-xs text-gray-400">
                                                            s/d
                                                        </span>{" "}
                                                        <br />
                                                        {new Date(
                                                            item.tgl_selesai,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 border-b text-center">
                                                        <span
                                                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${item.status === "Aktif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                                                        >
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 border-b text-center">
                                                        <div className="flex justify-center space-x-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleToggleStatus(
                                                                        item.id,
                                                                    )
                                                                }
                                                                className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded shadow transition"
                                                                title="Ubah Status"
                                                            >
                                                                {item.status ===
                                                                "Aktif"
                                                                    ? "Cabut"
                                                                    : "Aktifkan"}
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        item.id,
                                                                    )
                                                                }
                                                                className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded shadow transition"
                                                                title="Hapus"
                                                            >
                                                                Hapus
                                                            </button>
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
            </div>
        </AuthenticatedLayout>
    );
}
