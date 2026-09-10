import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import PrimaryButton from "@/Components/PrimaryButton";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";

export default function Index({ shifts }) {
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
        kode_shift: "",
        nama_shift: "",
        jam_masuk: "",
        jam_keluar: "",
        lintas_hari: false,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route("shift.update", editId), {
                onSuccess: () => cancelEdit(),
            });
        } else {
            post(route("shift.store"), { onSuccess: () => reset() });
        }
    };

    const handleEdit = (shift) => {
        clearErrors();
        setIsEditing(true);
        setEditId(shift.id);
        setData({
            kode_shift: shift.kode_shift,
            nama_shift: shift.nama_shift,
            jam_masuk: shift.jam_masuk.slice(0, 5),
            jam_keluar: shift.jam_keluar.slice(0, 5),
            lintas_hari: shift.lintas_hari === 1,
        });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        reset();
        clearErrors();
    };

    const handleDelete = (id) => {
        if (confirm("Yakin ingin menghapus shift ini?")) {
            destroy(route("shift.destroy", id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Master Data - Jam Shift
                </h2>
            }
        >
            <Head title="Master Shift" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Input */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg">
                        <h3 className="text-lg font-bold mb-4">
                            {isEditing ? "Edit Shift" : "Tambah Shift Baru"}
                        </h3>
                        {flash?.success && (
                            <div className="mb-4 text-green-600 font-bold text-sm bg-green-50 p-2 rounded">
                                {flash.success}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel value="Kode Shift (Contoh: S1)" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.kode_shift}
                                    onChange={(e) =>
                                        setData("kode_shift", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.kode_shift}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <InputLabel value="Nama Shift (Contoh: Pagi)" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.nama_shift}
                                    onChange={(e) =>
                                        setData("nama_shift", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.nama_shift}
                                    className="mt-1"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value="Jam Masuk" />
                                    <TextInput
                                        type="time"
                                        className="w-full mt-1"
                                        value={data.jam_masuk}
                                        onChange={(e) =>
                                            setData("jam_masuk", e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.jam_masuk}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Jam Keluar" />
                                    <TextInput
                                        type="time"
                                        className="w-full mt-1"
                                        value={data.jam_keluar}
                                        onChange={(e) =>
                                            setData(
                                                "jam_keluar",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.jam_keluar}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center mt-4">
                                <input
                                    type="checkbox"
                                    id="lintas_hari"
                                    checked={data.lintas_hari}
                                    onChange={(e) =>
                                        setData("lintas_hari", e.target.checked)
                                    }
                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                />
                                <label
                                    htmlFor="lintas_hari"
                                    className="ml-2 text-sm text-gray-600"
                                >
                                    Shift Lintas Hari (Cth: Malam ke Pagi)
                                </label>
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
                                    <th className="px-4 py-3 border-r">
                                        Jam Kerja
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {shifts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-4 py-8 text-center"
                                        >
                                            Belum ada Master Shift.
                                        </td>
                                    </tr>
                                ) : (
                                    shifts.map((shift) => (
                                        <tr
                                            key={shift.id}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 border-r font-bold text-gray-900">
                                                {shift.kode_shift} -{" "}
                                                {shift.nama_shift}
                                            </td>
                                            <td className="px-4 py-3 border-r">
                                                {shift.jam_masuk.slice(0, 5)}{" "}
                                                s/d{" "}
                                                {shift.jam_keluar.slice(0, 5)}
                                                {shift.lintas_hari === 1 && (
                                                    <span className="ml-2 text-xs text-red-500 font-bold">
                                                        (Lintas Hari)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 flex justify-center space-x-2">
                                                <SecondaryButton
                                                    onClick={() =>
                                                        handleEdit(shift)
                                                    }
                                                    className="!py-1 !px-2"
                                                >
                                                    Edit
                                                </SecondaryButton>
                                                <DangerButton
                                                    onClick={() =>
                                                        handleDelete(shift.id)
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
