import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import DangerButton from "@/Components/DangerButton";

export default function MasterCutiIndex({ auth, hariLiburs, defaultCuti }) {
    const { flash } = usePage().props;

    // Form untuk Ubah Default Cuti
    const formDefault = useForm({
        hak_cuti_default: defaultCuti,
    });

    const submitDefault = (e) => {
        e.preventDefault();
        formDefault.post(route("hc.cuti.default"), {
            preserveScroll: true,
        });
    };

    // Form untuk Tambah Hari Libur
    const formLibur = useForm({
        tanggal: "",
        keterangan: "",
        is_cuti_bersama: false,
    });

    const submitLibur = (e) => {
        e.preventDefault();
        formLibur.post(route("hc.libur.store"), {
            preserveScroll: true,
            onSuccess: () => formLibur.reset(),
        });
    };

    const deleteLibur = (id) => {
        if (
            confirm(
                "Yakin ingin menghapus hari libur ini dari kalender perusahaan?",
            )
        ) {
            router.delete(route("hc.libur.destroy", id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Master Pengaturan Cuti & Kalender Libur
                </h2>
            }
        >
            <Head title="Master Cuti & Libur" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Flash Message */}
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            <span>{flash.success}</span>
                        </div>
                    )}

                    {/* Grid Pengaturan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Panel 1: Jatah Cuti Default */}
                        <div className="bg-white p-6 overflow-hidden shadow-sm sm:rounded-lg">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Kebijakan Cuti Tahunan
                            </h3>
                            <form
                                onSubmit={submitDefault}
                                className="space-y-4"
                            >
                                <div>
                                    <InputLabel
                                        htmlFor="hak_cuti_default"
                                        value="Jatah Default Tahunan (Hari)"
                                    />
                                    <TextInput
                                        id="hak_cuti_default"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={
                                            formDefault.data.hak_cuti_default
                                        }
                                        onChange={(e) =>
                                            formDefault.setData(
                                                "hak_cuti_default",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={
                                            formDefault.errors.hak_cuti_default
                                        }
                                        className="mt-2"
                                    />
                                </div>
                                <PrimaryButton
                                    disabled={formDefault.processing}
                                >
                                    Simpan Perubahan
                                </PrimaryButton>
                            </form>
                        </div>

                        {/* Panel 2: Tambah Hari Libur Nasional */}
                        <div className="bg-white p-6 overflow-hidden shadow-sm sm:rounded-lg md:col-span-2">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Tambah Kalender Hari Libur / Cuti Bersama
                            </h3>
                            <form
                                onSubmit={submitLibur}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                            >
                                <div>
                                    <InputLabel
                                        htmlFor="tanggal"
                                        value="Tanggal Libur"
                                    />
                                    <TextInput
                                        id="tanggal"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={formLibur.data.tanggal}
                                        onChange={(e) =>
                                            formLibur.setData(
                                                "tanggal",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={formLibur.errors.tanggal}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="keterangan"
                                        value="Keterangan Acara / Hari Raya"
                                    />
                                    <TextInput
                                        id="keterangan"
                                        type="text"
                                        className="mt-1 block w-full"
                                        placeholder="Contoh: Hari Raya Idul Fitri"
                                        value={formLibur.data.keterangan}
                                        onChange={(e) =>
                                            formLibur.setData(
                                                "keterangan",
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={formLibur.errors.keterangan}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <PrimaryButton
                                        className="w-full justify-center"
                                        disabled={formLibur.processing}
                                    >
                                        + Tambah Libur
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Panel 3: Tabel Daftar Hari Libur */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Daftar Hari Libur Perusahaan
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Tanggal
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Keterangan
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {hariLiburs.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                                >
                                                    Belum ada kalender hari
                                                    libur yang ditambahkan.
                                                </td>
                                            </tr>
                                        ) : (
                                            hariLiburs.map((libur) => (
                                                <tr key={libur.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                                        {new Date(
                                                            libur.tanggal,
                                                        ).toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                dateStyle:
                                                                    "long",
                                                            },
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {libur.keterangan}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <DangerButton
                                                            onClick={() =>
                                                                deleteLibur(
                                                                    libur.id,
                                                                )
                                                            }
                                                        >
                                                            Hapus
                                                        </DangerButton>
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
