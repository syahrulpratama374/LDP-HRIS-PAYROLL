import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        total_pinjaman: "",
        tenor_bulan: "1",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("pinjaman.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Form Pengajuan Kasbon
                </h2>
            }
        >
            <Head title="Ajukan Kasbon" />

            <div className="py-12">
                <div className="max-w-xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Nominal Pinjaman (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={data.total_pinjaman}
                                    onChange={(e) =>
                                        setData(
                                            "total_pinjaman",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: 1000000"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    min="50000"
                                />
                                {errors.total_pinjaman && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {errors.total_pinjaman}
                                    </div>
                                )}
                                <span className="text-xs text-gray-500 mt-1">
                                    Minimal pengajuan Rp 50.000
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Tenor (Lama Cicilan)
                                </label>
                                <select
                                    value={data.tenor_bulan}
                                    onChange={(e) =>
                                        setData("tenor_bulan", e.target.value)
                                    }
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="1">
                                        1 Bulan (Potong gaji bulan depan)
                                    </option>
                                    <option value="2">2 Bulan</option>
                                    <option value="3">3 Bulan</option>
                                    <option value="6">6 Bulan</option>
                                    <option value="12">12 Bulan</option>
                                </select>
                                {errors.tenor_bulan && (
                                    <div className="text-red-500 text-sm mt-1">
                                        {errors.tenor_bulan}
                                    </div>
                                )}
                            </div>

                            {data.total_pinjaman && (
                                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        Estimasi Pemotongan Gaji: <br />
                                        <span className="font-bold text-lg">
                                            Rp{" "}
                                            {Number(
                                                data.total_pinjaman /
                                                    data.tenor_bulan,
                                            ).toLocaleString("id-ID")}{" "}
                                            / bulan
                                        </span>
                                    </p>
                                </div>
                            )}

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
