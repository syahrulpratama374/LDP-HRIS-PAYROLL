import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";

export default function CreateCuti({ auth, saldoCuti, masterJenisCuti }) {
    const { data, setData, post, processing, errors } = useForm({
        jenis_cuti_id: "",
        tanggal_mulai: "",
        tanggal_selesai: "",
        alasan: "",
        dokumen_bukti: null,
    });

    const [hariPengajuan, setHariPengajuan] = useState(0);
    const [melebihiKuota, setMelebihiKuota] = useState(false);
    const [selectedCuti, setSelectedCuti] = useState(null);

    // Pantau perubahan jenis cuti untuk mengambil detail dari master data
    useEffect(() => {
        const currentCuti = masterJenisCuti.find(
            (c) => c.id == data.jenis_cuti_id,
        );
        setSelectedCuti(currentCuti || null);
    }, [data.jenis_cuti_id, masterJenisCuti]);

    // Kalkulasi selisih hari dan validasi kuota
    useEffect(() => {
        if (data.tanggal_mulai && data.tanggal_selesai && selectedCuti) {
            const start = new Date(data.tanggal_mulai);
            const end = new Date(data.tanggal_selesai);

            if (end >= start) {
                // Hitung selisih hari (ditambah 1 agar hari H terhitung)
                const diffTime = Math.abs(end - start);
                const diffDays =
                    Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setHariPengajuan(diffDays);

                // Logika peringatan kuota
                if (selectedCuti.potong_cuti_tahunan) {
                    const sisaTahunan =
                        saldoCuti.hak_cuti_tahunan - saldoCuti.cuti_terpakai;
                    setMelebihiKuota(diffDays > sisaTahunan);
                } else {
                    setMelebihiKuota(diffDays > selectedCuti.kuota_default);
                }
            } else {
                setHariPengajuan(0);
                setMelebihiKuota(false);
            }
        } else {
            setHariPengajuan(0);
            setMelebihiKuota(false);
        }
    }, [data.tanggal_mulai, data.tanggal_selesai, selectedCuti, saldoCuti]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("cuti.store"));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Pengajuan Cuti
                </h2>
            }
        >
            <Head title="Pengajuan Cuti" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Widget Informasi Saldo Cuti Tahunan */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Informasi Saldo Cuti Tahunan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-sm text-gray-500 font-medium">
                                    Total Hak Cuti
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {saldoCuti.hak_cuti_tahunan} Hari
                                </p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                <p className="text-sm text-gray-500 font-medium">
                                    Terpakai
                                </p>
                                <p className="text-2xl font-bold text-red-600">
                                    {saldoCuti.cuti_terpakai} Hari
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <p className="text-sm text-gray-500 font-medium">
                                    Sisa Saldo
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                    {saldoCuti.hak_cuti_tahunan -
                                        saldoCuti.cuti_terpakai}{" "}
                                    Hari
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Pengajuan Cuti */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Jenis Cuti
                                </label>
                                <select
                                    value={data.jenis_cuti_id}
                                    onChange={(e) =>
                                        setData("jenis_cuti_id", e.target.value)
                                    }
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    required
                                >
                                    <option value="">
                                        -- Pilih Jenis Cuti --
                                    </option>
                                    {masterJenisCuti.map((cuti) => (
                                        <option key={cuti.id} value={cuti.id}>
                                            {cuti.nama_cuti} (Maks:{" "}
                                            {cuti.kuota_default} Hari)
                                        </option>
                                    ))}
                                </select>
                                {errors.jenis_cuti_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.jenis_cuti_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Mulai
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tanggal_mulai}
                                        onChange={(e) =>
                                            setData(
                                                "tanggal_mulai",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        required
                                    />
                                    {errors.tanggal_mulai && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.tanggal_mulai}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Tanggal Selesai
                                    </label>
                                    <input
                                        type="date"
                                        value={data.tanggal_selesai}
                                        onChange={(e) =>
                                            setData(
                                                "tanggal_selesai",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        required
                                    />
                                    {errors.tanggal_selesai && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.tanggal_selesai}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Alert Kalkulasi Hari & Peringatan Kuota */}
                            {hariPengajuan > 0 && (
                                <div
                                    className={`p-4 rounded-md border ${melebihiKuota ? "bg-red-50 border-red-200 text-red-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}
                                >
                                    <p className="font-semibold">
                                        Lama Pengajuan: {hariPengajuan} Hari
                                    </p>
                                    {melebihiKuota && (
                                        <p className="text-sm mt-1">
                                            ⚠️ Peringatan: Jumlah hari yang
                                            diajukan melebihi batas maksimal /
                                            sisa saldo cuti ini.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Alasan / Keterangan
                                </label>
                                <textarea
                                    value={data.alasan}
                                    onChange={(e) =>
                                        setData("alasan", e.target.value)
                                    }
                                    rows="3"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    placeholder="Jelaskan keperluan cuti..."
                                    required
                                ></textarea>
                                {errors.alasan && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.alasan}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Dokumen Bukti (Opsional)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) =>
                                        setData(
                                            "dokumen_bukti",
                                            e.target.files[0],
                                        )
                                    }
                                    accept=".jpg,.png,.pdf"
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Upload surat keterangan dokter/lampiran
                                    terkait jika diperlukan. (Maks 2MB, Format:
                                    JPG, PNG, PDF)
                                </p>
                                {errors.dokumen_bukti && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.dokumen_bukti}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-200">
                                <Link
                                    href={route("cuti.index")}
                                    className="text-gray-600 hover:text-gray-900 mr-4 text-sm font-medium"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                                >
                                    {processing
                                        ? "Menyimpan..."
                                        : "Ajukan Cuti"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
