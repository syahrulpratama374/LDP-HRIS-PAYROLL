import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";

export default function MasterCutiIndex({ auth, masterCuti }) {
    const { flash } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const { data, setData, post, put, reset, errors, processing } = useForm({
        nama_cuti: "",
        kuota_default: 1,
        potong_cuti_tahunan: false,
    });

    const openAddModal = () => {
        setIsEditMode(false);
        setEditId(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (cuti) => {
        setIsEditMode(true);
        setEditId(cuti.id);
        setData({
            nama_cuti: cuti.nama_cuti,
            kuota_default: cuti.kuota_default,
            potong_cuti_tahunan: Boolean(cuti.potong_cuti_tahunan),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route("master-cuti.update", editId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route("master-cuti.store"), { onSuccess: () => closeModal() });
        }
    };

    const handleDelete = (id) => {
        if (confirm("Yakin ingin menghapus jenis cuti ini?")) {
            router.delete(route("master-cuti.destroy", id));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Master Jenis Cuti" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {flash?.success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 font-semibold text-sm">
                            ✓ {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 font-semibold text-sm">
                            ⚠ {flash.error}
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">
                                Master Data Jenis Cuti
                            </h2>
                            <button
                                onClick={openAddModal}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition"
                            >
                                + Tambah Jenis Cuti
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Nama Cuti
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Kuota Default
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Potong Jatah Tahunan?
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {masterCuti.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-8 text-center text-gray-500 text-sm"
                                            >
                                                Data masih kosong.
                                            </td>
                                        </tr>
                                    ) : (
                                        masterCuti.map((cuti) => (
                                            <tr
                                                key={cuti.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-700">
                                                    {cuti.nama_cuti}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {cuti.kuota_default} Hari
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {cuti.potong_cuti_tahunan ? (
                                                        <span className="bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                            Ya
                                                        </span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                            Tidak
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(cuti)
                                                        }
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                cuti.id,
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Hapus
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

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {isEditMode
                                    ? "Edit Jenis Cuti"
                                    : "Tambah Jenis Cuti"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nama Cuti
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_cuti}
                                    onChange={(e) =>
                                        setData("nama_cuti", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                                {errors.nama_cuti && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.nama_cuti}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Kuota Default (Hari)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.kuota_default}
                                    onChange={(e) =>
                                        setData("kuota_default", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                                {errors.kuota_default && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.kuota_default}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center mt-4">
                                <input
                                    type="checkbox"
                                    id="potong"
                                    checked={data.potong_cuti_tahunan}
                                    onChange={(e) =>
                                        setData(
                                            "potong_cuti_tahunan",
                                            e.target.checked,
                                        )
                                    }
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                />
                                <label
                                    htmlFor="potong"
                                    className="ml-2 block text-sm text-gray-900 cursor-pointer"
                                >
                                    Potong Jatah Cuti Tahunan?
                                </label>
                            </div>
                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {processing ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
