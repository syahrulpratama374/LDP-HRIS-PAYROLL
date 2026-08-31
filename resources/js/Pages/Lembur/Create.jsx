import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        tanggal: "",
        jam_mulai: "17:00", // Default jam pulang kantor standar
        jam_selesai: "19:00", // Default lembur 2 jam
        deskripsi_pekerjaan: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("lembur.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Form Pengajuan Lembur
                </h2>
            }
        >
            <Head title="Ajukan Lembur" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Tanggal Lembur
                                </label>
                                <input
                                    type="date"
                                    value={data.tanggal}
                                    onChange={(e) =>
                                        setData("tanggal", e.target.value)
                                    }
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {errors.tanggal && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {errors.tanggal}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Jam Mulai
                                    </label>
                                    <input
                                        type="time"
                                        value={data.jam_mulai}
                                        onChange={(e) =>
                                            setData("jam_mulai", e.target.value)
                                        }
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.jam_mulai && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {errors.jam_mulai}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Jam Selesai
                                    </label>
                                    <input
                                        type="time"
                                        value={data.jam_selesai}
                                        onChange={(e) =>
                                            setData(
                                                "jam_selesai",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.jam_selesai && (
                                        <div className="text-red-500 text-sm mt-1">
                                            {errors.jam_selesai}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tombol Pintas Instan untuk Mempermudah Pengisian di HP */}
                            <div className="flex gap-2">
                                <span className="text-xs text-gray-500 self-center">
                                    Pintas Cepat:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData("jam_mulai", "17:00");
                                        setData("jam_selesai", "19:00");
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded border"
                                >
                                    17:00 - 19:00 (2 Jam)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData("jam_mulai", "17:00");
                                        setData("jam_selesai", "21:00");
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded border"
                                >
                                    17:00 - 21:00 (4 Jam)
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Deskripsi Pekerjaan / Tugas Lembur
                                </label>
                                <textarea
                                    rows="4"
                                    value={data.deskripsi_pekerjaan}
                                    onChange={(e) =>
                                        setData(
                                            "deskripsi_pekerjaan",
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Jelaskan pekerjaan yang diselesaikan selama lembur..."
                                ></textarea>
                                {errors.deskripsi_pekerjaan && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {errors.deskripsi_pekerjaan}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-all"
                                >
                                    Kirim Pengajuan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
