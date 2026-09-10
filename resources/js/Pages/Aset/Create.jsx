import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Create({ karyawans }) {
    const { data, setData, post, processing, errors } = useForm({
        nama_aset: "",
        kategori: "Elektronik",
        tgl_beli: "",
        harga_beli: "",
        tgl_expired_pajak: "",
        penanggung_jawab_id: "",
        status: "Tersedia",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("admin.aset.store"));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Registrasi Aset Baru & Generate QR
                </h2>
            }
        >
            <Head title="Tambah Aset" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8">
                        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-blue-800">
                            <strong>Informasi:</strong> Sistem akan otomatis
                            membuatkan <b>Kode Aset Unik</b> dan{" "}
                            <b>Gambar QR Code</b> setelah Anda menyimpan data
                            ini.
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Baris 1 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Nama Aset / Merk
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nama_aset}
                                        onChange={(e) =>
                                            setData("nama_aset", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Contoh: Laptop Asus ROG / Honda Vario"
                                        required
                                    />
                                    {errors.nama_aset && (
                                        <span className="text-red-500 text-xs">
                                            {errors.nama_aset}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Kategori
                                    </label>
                                    <select
                                        value={data.kategori}
                                        onChange={(e) =>
                                            setData("kategori", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="Elektronik">
                                            💻 Elektronik (Laptop, PC, Printer)
                                        </option>
                                        <option value="Kendaraan">
                                            🚗 Kendaraan (Mobil, Motor)
                                        </option>
                                        <option value="Furniture">
                                            🪑 Furniture (Meja, Kursi, Lemari)
                                        </option>
                                        <option value="Lisensi">
                                            🔑 Lisensi Software / Domain
                                        </option>
                                    </select>
                                </div>

                                {/* Baris 2 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Pembelian (Opsional)
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tgl_beli}
                                        onChange={(e) =>
                                            setData("tgl_beli", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Harga Beli Rp (Opsional)
                                    </label>
                                    <input
                                        type="number"
                                        value={data.harga_beli}
                                        onChange={(e) =>
                                            setData(
                                                "harga_beli",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Contoh: 15000000"
                                    />
                                </div>

                                {/* Baris 3 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tgl Kedaluwarsa STNK / Pajak (Khusus
                                        Kendaraan/Lisensi)
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tgl_expired_pajak}
                                        onChange={(e) =>
                                            setData(
                                                "tgl_expired_pajak",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-gray-500">
                                        Abaikan jika bukan kendaraan/lisensi.
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Status Aset
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) =>
                                            setData("status", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-bold"
                                    >
                                        <option
                                            value="Tersedia"
                                            className="text-green-600"
                                        >
                                            Tersedia (Di Gudang)
                                        </option>
                                        <option
                                            value="Dipakai"
                                            className="text-blue-600"
                                        >
                                            Dipakai (Dipegang Karyawan)
                                        </option>
                                        <option
                                            value="Rusak"
                                            className="text-red-600"
                                        >
                                            Rusak
                                        </option>
                                        <option
                                            value="Maintenance"
                                            className="text-orange-600"
                                        >
                                            Maintenance / Servis
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Penanggung Jawab */}
                            <div className="border-t border-gray-200 pt-6">
                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                    Ditugaskan Kepada / Pemegang Aset (Opsional)
                                </label>
                                <select
                                    value={data.penanggung_jawab_id}
                                    onChange={(e) =>
                                        setData(
                                            "penanggung_jawab_id",
                                            e.target.value,
                                        )
                                    }
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">
                                        -- Tidak Ditugaskan Ke Siapapun --
                                    </option>
                                    {karyawans.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.nama_lengkap} (
                                            {k.departemen?.nama_departemen ||
                                                "N/A"}
                                            )
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6">
                                <Link
                                    href={route("admin.aset.index")}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                    💾 Simpan & Cetak QR Code
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
