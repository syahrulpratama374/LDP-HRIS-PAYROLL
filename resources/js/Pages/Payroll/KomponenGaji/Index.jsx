import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";

export default function Index({ komponens }) {
    const { flash } = usePage().props;
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        kode_komponen: "",
        nama_komponen: "",
        jenis: "",
        is_taxable: false,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route("admin.komponen.update", editId), {
                onSuccess: () => cancelEdit(),
            });
        } else {
            post(route("admin.komponen.store"), { onSuccess: () => reset() });
        }
    };

    const handleEdit = (komp) => {
        clearErrors();
        setIsEditing(true);
        setEditId(komp.id);
        setData({
            kode_komponen: komp.kode_komponen,
            nama_komponen: komp.nama_komponen,
            jenis: komp.jenis,
            is_taxable: komp.is_taxable === 1,
        });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        reset();
        clearErrors();
    };

    const handleDelete = (id) => {
        if (confirm("Yakin ingin menghapus komponen ini?")) {
            destroy(route("admin.komponen.destroy", id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Master Data - Komponen Gaji
                </h2>
            }
        >
            <Head title="Komponen Gaji" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Input */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg sticky top-6">
                        <h3 className="text-lg font-bold mb-4">
                            {isEditing
                                ? "✏️ Edit Komponen"
                                : "➕ Tambah Komponen Baru"}
                        </h3>
                        {flash?.success && (
                            <div className="mb-4 text-green-600 font-bold text-sm bg-green-50 p-2 rounded">
                                {flash.success}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel value="Kode Komponen (Cth: TJ-MAKAN)" />
                                <TextInput
                                    className="w-full mt-1 uppercase"
                                    value={data.kode_komponen}
                                    onChange={(e) =>
                                        setData(
                                            "kode_komponen",
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.kode_komponen}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <InputLabel value="Nama Komponen (Cth: Tunjangan Makan)" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.nama_komponen}
                                    onChange={(e) =>
                                        setData("nama_komponen", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.nama_komponen}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <InputLabel value="Jenis Komponen" />
                                <select
                                    className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.jenis}
                                    onChange={(e) =>
                                        setData("jenis", e.target.value)
                                    }
                                >
                                    <option value="">-- Pilih Jenis --</option>
                                    <option value="Tunjangan">
                                        Tunjangan (Menambah Gaji)
                                    </option>
                                    <option value="Potongan">
                                        Potongan (Mengurangi Gaji)
                                    </option>
                                </select>
                                <InputError
                                    message={errors.jenis}
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex items-start mt-4 bg-gray-50 p-3 rounded border">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        id="is_taxable"
                                        checked={data.is_taxable}
                                        onChange={(e) =>
                                            setData(
                                                "is_taxable",
                                                e.target.checked,
                                            )
                                        }
                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label
                                        htmlFor="is_taxable"
                                        className="font-bold text-gray-700"
                                    >
                                        Kena Pajak PPh 21 (Taxable)?
                                    </label>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Centang jika nominal ini dimasukkan
                                        dalam perhitungan Bruto pajak.
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-2 pt-2">
                                <PrimaryButton
                                    disabled={processing}
                                    className="w-full justify-center"
                                >
                                    Simpan
                                </PrimaryButton>
                                {isEditing && (
                                    <SecondaryButton
                                        onClick={cancelEdit}
                                        className="w-full justify-center"
                                    >
                                        Batal
                                    </SecondaryButton>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Tabel Data */}
                <div className="md:col-span-2">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 border">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                <tr>
                                    <th className="px-4 py-3 border-r">
                                        Kode & Nama
                                    </th>
                                    <th className="px-4 py-3 border-r text-center">
                                        Sifat
                                    </th>
                                    <th className="px-4 py-3 border-r text-center">
                                        Pajak (Taxable)
                                    </th>
                                    <th className="px-4 py-3 text-center w-32">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {komponens.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-4 py-8 text-center"
                                        >
                                            Belum ada Master Komponen Payroll.
                                        </td>
                                    </tr>
                                ) : (
                                    komponens.map((komp) => (
                                        <tr
                                            key={komp.id}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 border-r">
                                                <div className="font-bold text-gray-900">
                                                    {komp.nama_komponen}
                                                </div>
                                                <div className="text-xs font-mono text-gray-400">
                                                    {komp.kode_komponen}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 border-r text-center">
                                                <span
                                                    className={`px-2 py-1 text-xs font-bold rounded ${komp.jenis === "Tunjangan" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                                >
                                                    {komp.jenis}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-r text-center">
                                                {komp.is_taxable ? (
                                                    <span className="text-orange-600 font-bold text-xs bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                                        Ya (Kena PPh)
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 text-xs">
                                                        Tidak
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 flex justify-center space-x-2">
                                                <SecondaryButton
                                                    onClick={() =>
                                                        handleEdit(komp)
                                                    }
                                                    className="!py-1 !px-2"
                                                >
                                                    Edit
                                                </SecondaryButton>
                                                <DangerButton
                                                    onClick={() =>
                                                        handleDelete(komp.id)
                                                    }
                                                    className="!py-1 !px-2"
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
        </AuthenticatedLayout>
    );
}
