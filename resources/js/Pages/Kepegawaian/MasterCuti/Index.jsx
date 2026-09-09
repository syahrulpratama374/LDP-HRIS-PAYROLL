import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import DangerButton from "@/Components/DangerButton";

export default function MasterCutiIndex({ auth, hariLiburs, defaultCuti }) {
    const { flash, errors: pageErrors } = usePage().props;

    const formDefault = useForm({
        hak_cuti_default: defaultCuti,
    });

    const submitDefault = (e) => {
        e.preventDefault();
        formDefault.post(route("hc.cuti.default"), {
            preserveScroll: true,
        });
    };

    const formLibur = useForm({
        tanggal: "",
        keterangan: "",
        is_cuti_bersama: false,
    });

    const submitLibur = (e) => {
        e.preventDefault();
        if (formLibur.data.is_cuti_bersama) {
            if (
                !confirm(
                    "PERINGATAN! Menyimpan Cuti Bersama akan otomatis memotong 1 hari saldo cuti tahunan milik SELURUH karyawan aktif. Lanjutkan?",
                )
            ) {
                return;
            }
        }
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
                    {flash?.success && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            <span className="font-bold">Sukses!</span>{" "}
                            {flash.success}
                        </div>
                    )}
                    {pageErrors?.error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            <span className="font-bold">Gagal!</span>{" "}
                            {pageErrors.error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Panel 1: Jatah Cuti Default */}
                        <div className="bg-white p-6 overflow-hidden shadow-sm sm:rounded-lg">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">
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
                                        className="mt-1 block w-full font-bold text-lg text-center"
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
                                    className="w-full justify-center"
                                >
                                    Simpan Default Cuti
                                </PrimaryButton>
                            </form>
                            <p className="text-xs text-gray-500 mt-4 text-justify">
                                Angka ini akan menjadi patokan awal saat
                                karyawan baru dibuatkan saldo cutinya secara
                                otomatis oleh sistem.
                            </p>
                        </div>

                        {/* Panel 2: Tambah Hari Libur Nasional */}
                        <div className="bg-white p-6 overflow-hidden shadow-sm sm:rounded-lg md:col-span-2">
                            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">
                                Tambah Kalender Hari Libur / Cuti Bersama
                            </h3>
                            <form onSubmit={submitLibur} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            message={
                                                formLibur.errors.keterangan
                                            }
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 p-4 bg-gray-50 border rounded-md">
                                    <div className="flex items-center mb-4 md:mb-0">
                                        <input
                                            id="is_cuti_bersama"
                                            type="checkbox"
                                            className="rounded border-gray-300 text-red-600 shadow-sm focus:ring-red-500 h-5 w-5"
                                            checked={
                                                formLibur.data.is_cuti_bersama
                                            }
                                            onChange={(e) =>
                                                formLibur.setData(
                                                    "is_cuti_bersama",
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor="is_cuti_bersama"
                                            className="ml-3 block text-sm text-gray-900 font-bold cursor-pointer"
                                        >
                                            Tandai sebagai{" "}
                                            <span className="text-red-600">
                                                Cuti Bersama
                                            </span>{" "}
                                            (Potong Saldo Massal)
                                        </label>
                                    </div>
                                    <PrimaryButton
                                        disabled={formLibur.processing}
                                        className={
                                            formLibur.data.is_cuti_bersama
                                                ? "!bg-red-600 hover:!bg-red-700"
                                                : ""
                                        }
                                    >
                                        {formLibur.data.is_cuti_bersama
                                            ? "⚠️ Simpan & Potong Cuti"
                                            : "+ Tambah Libur Nasional"}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Panel 3: Tabel Daftar Hari Libur */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                            Daftar Hari Libur Perusahaan
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Keterangan
                                        </th>
                                        <th className="px-6 py-3 border-b text-left text-xs font-semibold text-gray-600 uppercase">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 border-b text-center text-xs font-semibold text-gray-600 uppercase">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hariLiburs.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-8 text-center text-gray-500"
                                            >
                                                Belum ada kalender hari libur
                                                yang ditambahkan.
                                            </td>
                                        </tr>
                                    ) : (
                                        hariLiburs.map((libur) => (
                                            <tr
                                                key={libur.id}
                                                className="hover:bg-gray-50 transition border-b last:border-0"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                                    {new Date(
                                                        libur.tanggal,
                                                    ).toLocaleDateString(
                                                        "id-ID",
                                                        { dateStyle: "long" },
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {libur.keterangan}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {libur.is_cuti_bersama ? (
                                                        <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold border border-red-200">
                                                            Cuti Bersama
                                                        </span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold border border-green-200">
                                                            Libur Nasional
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <DangerButton
                                                        onClick={() =>
                                                            deleteLibur(
                                                                libur.id,
                                                            )
                                                        }
                                                        className="!py-1 !px-2 !text-xs"
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
        </AuthenticatedLayout>
    );
}
