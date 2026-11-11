import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import BannerHeader from "@/Components/BannerHeader";

export default function Index({
    karyawans = [],
    shifts = [],
    departemens = [],
    rosterMatrix = {},
    filters = {},
    jumlahHari = 31,
}) {
    const [bulan, setBulan] = useState(
        filters.bulan || new Date().getMonth() + 1,
    );
    const [tahun, setTahun] = useState(
        filters.tahun || new Date().getFullYear(),
    );
    const [departemenId, setDepartemenId] = useState(
        filters.departemen_id || "",
    );

    // State penampung perubahan matriks sebelum disimpan
    const [matrix, setMatrix] = useState(rosterMatrix);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setMatrix(rosterMatrix);
        setIsDirty(false);
    }, [rosterMatrix]);

    // Format Tanggal ISO YYYY-MM-DD
    const getTanggalString = (day) => {
        const m = String(bulan).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${tahun}-${m}-${d}`;
    };

    // Handle Perubahan Shift pada Sel Matriks
    const handleShiftChange = (karyawanId, day, shiftId) => {
        const tglStr = getTanggalString(day);
        const key = `${karyawanId}_${tglStr}`;

        setMatrix((prev) => ({
            ...prev,
            [key]: shiftId ? Number(shiftId) : null,
        }));
        setIsDirty(true);
    };

    // Apply Filter Bulan/Tahun/Departemen
    const handleFilterChange = (newBulan, newTahun, newDept) => {
        router.get(
            route("jadwal-shift.index"),
            {
                bulan: newBulan,
                tahun: newTahun,
                departemen_id: newDept,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Simpan Semua Perubahan Ke Backend
    const handleSave = () => {
        setIsSubmitting(true);

        const payload = [];
        Object.keys(matrix).forEach((key) => {
            const [karyawanId, tanggal] = key.split("_");
            payload.push({
                karyawan_id: Number(karyawanId),
                tanggal: tanggal,
                shift_id: matrix[key] || null,
            });
        });

        router.post(
            route("jadwal-shift.store"),
            { roster: payload },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setIsDirty(false);
                    alert("Plotting roster shift berhasil disimpan!");
                },
                onError: () => {
                    setIsSubmitting(false);
                    alert("Gagal menyimpan roster. Periksa data kembali.");
                },
            },
        );
    };

    // Daftar nama bulan dalam bahasa Indonesia
    const namaBulanList = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];

    // Generator List Hari untuk Header Tabel
    const daysArray = Array.from({ length: jumlahHari }, (_, i) => i + 1);

    return (
        <AuthenticatedLayout>
            <Head title="Plotting Roster Shift" />

            <div className="min-h-screen bg-[#F7F7FA]">
                <BannerHeader
                    subtitle="LDP HRIS"
                    title="Plotting Roster Shift NOC"
                />

                <main className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
                    {/* BARIS FILTER & KONTROL */}
                    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Bulan
                                </label>
                                <select
                                    value={bulan}
                                    onChange={(e) => {
                                        setBulan(e.target.value);
                                        handleFilterChange(
                                            e.target.value,
                                            tahun,
                                            departemenId,
                                        );
                                    }}
                                    className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#2A164E] outline-none focus:border-[#431D6D]"
                                >
                                    {namaBulanList.map((nama, idx) => (
                                        <option key={idx + 1} value={idx + 1}>
                                            {nama}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Tahun
                                </label>
                                <select
                                    value={tahun}
                                    onChange={(e) => {
                                        setTahun(e.target.value);
                                        handleFilterChange(
                                            bulan,
                                            e.target.value,
                                            departemenId,
                                        );
                                    }}
                                    className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#2A164E] outline-none focus:border-[#431D6D]"
                                >
                                    {[2025, 2026, 2027].map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    Departemen
                                </label>
                                <select
                                    value={departemenId}
                                    onChange={(e) => {
                                        setDepartemenId(e.target.value);
                                        handleFilterChange(
                                            bulan,
                                            tahun,
                                            e.target.value,
                                        );
                                    }}
                                    className="mt-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#2A164E] outline-none focus:border-[#431D6D]"
                                >
                                    <option value="">Semua Dept Shift</option>
                                    {departemens.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.nama_departemen}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* TOMBOL SIMPAN */}
                        <div className="flex items-center gap-3">
                            {isDirty && (
                                <span className="text-xs font-semibold text-amber-600 animate-pulse">
                                    ● Ada perubahan belum disimpan
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting || !isDirty}
                                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                                    isDirty && !isSubmitting
                                        ? "bg-[#2A164E] text-white hover:bg-[#431D6D] shadow-md"
                                        : "cursor-not-allowed bg-gray-200 text-gray-400"
                                }`}
                            >
                                {isSubmitting
                                    ? "Menyimpan..."
                                    : "Simpan Plotting Roster"}
                            </button>
                        </div>
                    </div>

                    {/* MATRIKS TABEL JADWAL SHIFT */}
                    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-[#2A164E] text-white">
                                    <th className="sticky left-0 z-20 bg-[#2A164E] p-3 text-xs font-bold uppercase tracking-wider min-w-[200px]">
                                        Karyawan NOC
                                    </th>
                                    {daysArray.map((day) => {
                                        const dateObj = new Date(
                                            tahun,
                                            bulan - 1,
                                            day,
                                        );
                                        const isWeekend =
                                            dateObj.getDay() === 0 ||
                                            dateObj.getDay() === 6;
                                        return (
                                            <th
                                                key={day}
                                                className={`p-2 text-center text-xs font-bold min-w-[65px] border-l border-white/10 ${
                                                    isWeekend
                                                        ? "bg-amber-500/20 text-amber-300"
                                                        : ""
                                                }`}
                                            >
                                                <div>{day}</div>
                                                <div className="text-[9px] font-normal opacity-75">
                                                    {dateObj.toLocaleDateString(
                                                        "id-ID",
                                                        { weekday: "narrow" },
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {karyawans.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={jumlahHari + 1}
                                            className="p-8 text-center text-gray-400"
                                        >
                                            Tidak ada data karyawan NOC pada
                                            departemen terpilih.
                                        </td>
                                    </tr>
                                ) : (
                                    karyawans.map((karyawan) => (
                                        <tr
                                            key={karyawan.id}
                                            className="hover:bg-purple-50/30 transition"
                                        >
                                            {/* NAMA KARYAWAN (STICKY COLUMN) */}
                                            <td className="sticky left-0 z-10 bg-white p-3 font-semibold text-[#2A164E] shadow-[2px_0_5px_rgba(0,0,0,0.03)] min-w-[200px]">
                                                <div className="truncate">
                                                    {karyawan.nama_lengkap}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-normal truncate">
                                                    {karyawan.jabatan
                                                        ?.nama_jabatan || "-"}
                                                </div>
                                            </td>

                                            {/* SEL SHIFT TANGGAL 1 - END */}
                                            {daysArray.map((day) => {
                                                const tglStr =
                                                    getTanggalString(day);
                                                const currentShiftId =
                                                    matrix[
                                                        `${karyawan.id}_${tglStr}`
                                                    ] || "";

                                                return (
                                                    <td
                                                        key={day}
                                                        className="p-1 border-l border-gray-100 text-center"
                                                    >
                                                        <select
                                                            value={
                                                                currentShiftId
                                                            }
                                                            onChange={(e) =>
                                                                handleShiftChange(
                                                                    karyawan.id,
                                                                    day,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className={`w-full rounded-lg border p-1 text-[11px] font-medium text-center outline-none transition ${
                                                                currentShiftId
                                                                    ? "border-purple-300 bg-purple-50 text-purple-900 font-bold"
                                                                    : "border-gray-200 bg-white text-gray-400"
                                                            }`}
                                                        >
                                                            <option value="">
                                                                - Off -
                                                            </option>
                                                            {shifts.map((s) => (
                                                                <option
                                                                    key={s.id}
                                                                    value={s.id}
                                                                >
                                                                    {
                                                                        s.nama_shift
                                                                    }
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
