import React, { useMemo, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage, useForm } from "@inertiajs/react";

export default function Index({ auth, pinjaman = [] }) {
    const { flash, errors } = usePage().props;
    const [search, setSearch] = useState("");
    const [selectedPinjaman, setSelectedPinjaman] = useState(null);
    const [selectedCicilan, setSelectedCicilan] = useState(null);

    const formBayar = useForm({
        bukti_transfer: null,
    });

    const submitUploadBukti = (e) => {
        e.preventDefault();
        if (!selectedCicilan) return;

        formBayar.post(route("pinjaman.bayarManual", selectedCicilan.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setSelectedCicilan(null);
                setSelectedPinjaman(null);
                formBayar.reset();
            },
        });
    };

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka || 0);
    };

    const formatTanggalLengkap = (tanggal) => {
        if (!tanggal) return "-";
        const date = new Date(tanggal);
        return isNaN(date)
            ? tanggal
            : date.toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
              });
    };

    const getStatusStyle = (status) => {
        if (status === "Lunas" || status === "Disetujui")
            return "border-green-200 bg-green-50 text-green-700";
        if (status === "Berjalan")
            return "border-blue-200 bg-blue-50 text-blue-700";
        if (status === "Ditolak")
            return "border-red-200 bg-red-50 text-red-700";
        return "border-yellow-200 bg-yellow-50 text-yellow-700";
    };

    const filteredPinjaman = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return pinjaman;

        return pinjaman.filter((p) => {
            const status = p.status?.toLowerCase() || "";
            const total = p.total_pinjaman?.toString() || "";
            return status.includes(keyword) || total.includes(keyword);
        });
    }, [search, pinjaman]);

    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Riwayat Kasbon & Pinjaman" />

            <div className="min-h-screen bg-[#F7F7FA]">
                <div className="bg-gradient-to-r from-[#2A164E] to-[#431D6D] py-4">
                    <div className="mx-auto max-w-7xl px-4 text-center">
                        <h1 className="text-xl font-bold text-white">
                            Riwayat Kasbon & Pinjaman
                        </h1>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 py-5">
                    {flash?.success && (
                        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700">
                            ✓ {flash.success}
                        </div>
                    )}

                    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                        <div className="border-b p-4 flex justify-between items-center">
                            <h2 className="font-bold text-[#2A164E]">
                                Daftar Pengajuan Kasbon Anda
                            </h2>
                            <Link
                                href={route("pinjaman.create")}
                                className="rounded-lg bg-[#2A164E] px-4 py-2 text-xs font-semibold text-white"
                            >
                                + Ajukan Pinjaman
                            </Link>
                        </div>

                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3">Sumber & Tanggal</th>
                                    <th className="p-3">Total Pinjaman</th>
                                    <th className="p-3">Tenor</th>
                                    <th className="p-3">Sisa Hutang</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPinjaman.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="border-b hover:bg-gray-50"
                                    >
                                        <td className="p-3 font-bold text-[#2A164E]">
                                            Kas {p.jenis_kasbon || "Finance"}
                                        </td>
                                        <td className="p-3 font-bold text-gray-800">
                                            {formatRupiah(p.total_pinjaman)}
                                        </td>
                                        <td className="p-3">
                                            {p.tenor_bulan} Bulan
                                        </td>
                                        <td className="p-3 text-red-600 font-semibold">
                                            {formatRupiah(p.sisa_pinjaman)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(p.status)}`}
                                            >
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() =>
                                                    setSelectedPinjaman(p)
                                                }
                                                className="rounded-lg border bg-[#F3EDF8] px-3 py-1.5 text-xs font-semibold text-[#431D6D]"
                                            >
                                                Lihat Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL DETAIL PINJAMAN */}
            {selectedPinjaman && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
                        <div className="bg-[#2A164E] p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold">
                                Detail Kasbon ({selectedPinjaman.jenis_kasbon})
                            </h3>
                            <span
                                className={`px-2 py-0.5 text-xs rounded border ${getStatusStyle(selectedPinjaman.status)}`}
                            >
                                {selectedPinjaman.status}
                            </span>
                        </div>

                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border">
                                <div>
                                    <p className="text-gray-400 font-bold">
                                        KEPERLUAN
                                    </p>
                                    <p className="font-semibold">
                                        {selectedPinjaman.alasan_pinjaman ||
                                            "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold">
                                        SISA HUTANG
                                    </p>
                                    <p className="font-bold text-red-600">
                                        {formatRupiah(
                                            selectedPinjaman.sisa_pinjaman,
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* TABEL ANGSURAN WITH UPLOAD BUTTON */}
                            <div>
                                <h4 className="font-bold text-[#2A164E] uppercase mb-2">
                                    Jadwal Pemotongan / Angsuran
                                </h4>
                                <table className="w-full border text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2 border">
                                                Bulan Ke
                                            </th>
                                            <th className="p-2 border">
                                                Jatuh Tempo
                                            </th>
                                            <th className="p-2 border">
                                                Nominal
                                            </th>
                                            <th className="p-2 border">
                                                Status
                                            </th>
                                            <th className="p-2 border text-center">
                                                Pelunasan Direct
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPinjaman.cicilans?.map(
                                            (c, idx) => (
                                                <tr
                                                    key={c.id}
                                                    className="border-b"
                                                >
                                                    <td className="p-2 border font-bold">
                                                        #{idx + 1}
                                                    </td>
                                                    <td className="p-2 border">
                                                        {formatTanggalLengkap(
                                                            c.jatuh_tempo,
                                                        )}
                                                    </td>
                                                    <td className="p-2 border font-semibold">
                                                        {formatRupiah(
                                                            c.nominal_cicilan,
                                                        )}
                                                    </td>
                                                    <td className="p-2 border">
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                c.status_bayar ===
                                                                "Lunas"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : c.status_bayar ===
                                                                        "Menunggu Validasi"
                                                                      ? "bg-orange-100 text-orange-700"
                                                                      : "bg-yellow-100 text-yellow-700"
                                                            }`}
                                                        >
                                                            {c.status_bayar}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 border text-center">
                                                        {c.status_bayar ===
                                                            "Belum Lunas" &&
                                                            selectedPinjaman.status ===
                                                                "Berjalan" && (
                                                                <button
                                                                    onClick={() =>
                                                                        setSelectedCicilan(
                                                                            c,
                                                                        )
                                                                    }
                                                                    className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded text-[10px] hover:bg-indigo-700"
                                                                >
                                                                    Upload Bukti
                                                                    Bayar 📤
                                                                </button>
                                                            )}
                                                        {c.status_bayar ===
                                                            "Menunggu Validasi" && (
                                                            <span className="text-[10px] italic text-orange-600 font-semibold">
                                                                Menunggu Cek
                                                                Atasan/Finance
                                                            </span>
                                                        )}
                                                        {c.status_bayar ===
                                                            "Lunas" && (
                                                            <span className="text-[10px] text-green-600 font-bold">
                                                                ✓ Lunas
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end border-t bg-gray-50 p-3">
                            <button
                                onClick={() => setSelectedPinjaman(null)}
                                className="px-4 py-1.5 bg-[#2A164E] text-white font-bold rounded"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL UPLOAD BUKTI TRANSFER UNTUK KARYAWAN */}
            {selectedCicilan && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl relative z-[70]">
                        <div className="bg-[#2A164E] p-4 text-white">
                            <h3 className="font-bold text-sm">
                                Upload Bukti Transfer Pelunasan Direct
                            </h3>
                        </div>

                        <form
                            onSubmit={submitUploadBukti}
                            className="p-4 space-y-4"
                        >
                            <div className="p-3 bg-indigo-50 border rounded-lg text-xs">
                                <p className="text-gray-500 font-bold">
                                    NOMINAL ANGSURAN
                                </p>
                                <p className="text-lg font-extrabold text-[#2A164E]">
                                    {formatRupiah(
                                        selectedCicilan.nominal_cicilan,
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">
                                    PILIH FOTO BUKTI TRANSFER{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={(e) =>
                                        formBayar.setData(
                                            "bukti_transfer",
                                            e.target.files[0],
                                        )
                                    }
                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#2A164E] file:text-white pointer-events-auto"
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCicilan(null)}
                                    className="px-3 py-1.5 bg-gray-100 text-xs font-bold rounded hover:bg-gray-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formBayar.processing}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow transition pointer-events-auto cursor-pointer disabled:opacity-50"
                                >
                                    {formBayar.processing
                                        ? "Mengirim..."
                                        : "Kirim Bukti Bayar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
