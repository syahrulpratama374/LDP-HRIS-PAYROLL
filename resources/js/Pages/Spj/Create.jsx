import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        tujuan: "",
        keperluan: "",
        tgl_mulai: "",
        tgl_selesai: "",
        komponen_biaya: [
            {
                jenis_biaya: "Tiket Pesawat/Kereta",
                nominal: "",
                keterangan: "",
            },
        ],
    });

    // Fungsi Tambah Baris Biaya
    const addBiaya = () => {
        setData("komponen_biaya", [
            ...data.komponen_biaya,
            { jenis_biaya: "Penginapan", nominal: "", keterangan: "" },
        ]);
    };

    // Fungsi Hapus Baris Biaya
    const removeBiaya = (index) => {
        const newBiaya = [...data.komponen_biaya];
        newBiaya.splice(index, 1);
        setData("komponen_biaya", newBiaya);
    };

    // Fungsi Update Nilai Input di Baris Tertentu
    const handleBiayaChange = (index, field, value) => {
        const newBiaya = [...data.komponen_biaya];
        newBiaya[index][field] = value;
        setData("komponen_biaya", newBiaya);
    };

    // Hitung Total Otomatis
    const totalEstimasi = data.komponen_biaya.reduce(
        (sum, item) => sum + (Number(item.nominal) || 0),
        0,
    );

    const submit = (e) => {
        e.preventDefault();
        post(route("spj.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Form Pengajuan SPJ
                </h2>
            }
        >
            <Head title="Ajukan SPJ" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={submit} className="space-y-6">
                            {/* --- BAGIAN 1: DETAIL PERJALANAN --- */}
                            <div className="border-b pb-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    1. Detail Perjalanan
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Kota Tujuan
                                        </label>
                                        <input
                                            type="text"
                                            value={data.tujuan}
                                            onChange={(e) =>
                                                setData(
                                                    "tujuan",
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full border-gray-300 rounded-md"
                                            placeholder="Contoh: Jakarta - PT Maju Jaya"
                                        />
                                        {errors.tujuan && (
                                            <div className="text-red-500 text-sm mt-1">
                                                {errors.tujuan}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Tanggal Mulai
                                        </label>
                                        <input
                                            type="date"
                                            value={data.tgl_mulai}
                                            onChange={(e) =>
                                                setData(
                                                    "tgl_mulai",
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Tanggal Selesai
                                        </label>
                                        <input
                                            type="date"
                                            value={data.tgl_selesai}
                                            onChange={(e) =>
                                                setData(
                                                    "tgl_selesai",
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Keperluan Perjalanan
                                        </label>
                                        <textarea
                                            rows="3"
                                            value={data.keperluan}
                                            onChange={(e) =>
                                                setData(
                                                    "keperluan",
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full border-gray-300 rounded-md"
                                            placeholder="Jelaskan agenda perjalanan dinas..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* --- BAGIAN 2: RINCIAN BIAYA DINAMIS --- */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex justify-between items-center">
                                    <span>2. Rincian Estimasi Biaya</span>
                                    <button
                                        type="button"
                                        onClick={addBiaya}
                                        className="text-sm bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
                                    >
                                        + Tambah Baris Biaya
                                    </button>
                                </h3>

                                {data.komponen_biaya.map((item, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-12 gap-3 mb-3 items-center bg-gray-50 p-3 rounded border"
                                    >
                                        <div className="col-span-3">
                                            <select
                                                value={item.jenis_biaya}
                                                onChange={(e) =>
                                                    handleBiayaChange(
                                                        index,
                                                        "jenis_biaya",
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-sm border-gray-300 rounded-md"
                                            >
                                                <option value="Tiket Pesawat/Kereta">
                                                    Tiket Kendaraan
                                                </option>
                                                <option value="Penginapan">
                                                    Penginapan/Hotel
                                                </option>
                                                <option value="Uang Makan">
                                                    Uang Makan
                                                </option>
                                                <option value="Transportasi Lokal">
                                                    Transportasi Lokal
                                                </option>
                                                <option value="Lain-lain">
                                                    Lain-lain
                                                </option>
                                            </select>
                                        </div>
                                        <div className="col-span-4">
                                            <input
                                                type="text"
                                                value={item.keterangan}
                                                onChange={(e) =>
                                                    handleBiayaChange(
                                                        index,
                                                        "keterangan",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Ket (Cth: Hotel Aston 2 Malam)"
                                                className="w-full text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <input
                                                type="number"
                                                value={item.nominal}
                                                onChange={(e) =>
                                                    handleBiayaChange(
                                                        index,
                                                        "nominal",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Nominal (Rp)"
                                                className="w-full text-sm border-gray-300 rounded-md"
                                            />
                                        </div>
                                        <div className="col-span-1 text-center">
                                            {data.komponen_biaya.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeBiaya(index)
                                                    }
                                                    className="text-red-500 hover:text-red-700 font-bold text-xl"
                                                >
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="text-right mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-900 font-bold text-lg">
                                    Total Estimasi: Rp{" "}
                                    {totalEstimasi.toLocaleString("id-ID")}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-all"
                                >
                                    Kirim Pengajuan SPJ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
