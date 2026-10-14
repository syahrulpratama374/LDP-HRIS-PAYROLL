import React, { useState, useEffect, useRef, useCallback } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import Webcam from "react-webcam";

export default function Create({ auth, absensiHariIni, karyawan }) {
    const webcamRef = useRef(null);

    // =========================================================
    // STATE
    // =========================================================

    const [waktu, setWaktu] = useState(new Date());
    const [koordinat, setKoordinat] = useState("");
    const [statusLokasi, setStatusLokasi] = useState("Menghubungkan ke GPS...");
    const [isLocationReady, setIsLocationReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [bukaKameraPulang, setBukaKameraPulang] = useState(false);
    const [catatanLogbook, setCatatanLogbook] = useState("");

    // =========================================================
    // CLOCK
    // =========================================================

    useEffect(() => {
        const timer = setInterval(() => {
            setWaktu(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // =========================================================
    // GPS
    // =========================================================

    useEffect(() => {
        if (!navigator.geolocation) {
            setStatusLokasi("Browser tidak mendukung GPS.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                setKoordinat(`${lat}, ${lon}`);
                setStatusLokasi("Lokasi berhasil terdeteksi");
                setIsLocationReady(true);
            },
            () => {
                setStatusLokasi(
                    "Lokasi belum diizinkan. Aktifkan GPS browser.",
                );
                setIsLocationReady(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    }, []);

    // =========================================================
    // ABSENSI STATUS
    // =========================================================

    const sudahMasuk =
        absensiHariIni?.waktu_masuk !== null &&
        absensiHariIni?.waktu_masuk !== undefined;

    const sudahKeluar =
        absensiHariIni?.waktu_keluar !== null &&
        absensiHariIni?.waktu_keluar !== undefined;

    const statusAbsensi = absensiHariIni?.status || null;

    const statusNonKehadiran = ["Cuti", "Izin", "Alpha"].includes(
        statusAbsensi,
    );

    // =========================================================
    // FORMAT
    // =========================================================

    const formatTanggal = (date) => {
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatJam = (value) => {
        if (!value) return "-";

        try {
            let date = new Date(value);

            if (Number.isNaN(date.getTime()) && typeof value === "string") {
                date = new Date(value.replace(" ", "T"));
            }

            if (!Number.isNaN(date.getTime())) {
                return date.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
            }

            const match = String(value).match(/(\d{2}):(\d{2})/);

            if (match) {
                return `${match[1]}:${match[2]}`;
            }

            return "-";
        } catch {
            return "-";
        }
    };

    const jamStr = waktu.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    // =========================================================
    // CLOCK IN / OUT
    // =========================================================

    const handleAbsen = useCallback(
        (tipe) => {
            if (!isLocationReady) {
                alert("Lokasi belum terdeteksi. Silakan tunggu GPS.");
                return;
            }

            if (!webcamRef.current) {
                alert("Kamera belum siap.");
                return;
            }

            const imageSrc = webcamRef.current.getScreenshot();

            if (!imageSrc) {
                alert("Foto belum berhasil diambil. Silakan coba lagi.");
                return;
            }

            setIsSubmitting(true);

            router.post(
                route("absensi.store"),
                {
                    image: imageSrc,
                    koordinat,
                    tipe,
                    catatan_logbook: catatanLogbook,
                },
                {
                    preserveScroll: true,

                    onSuccess: () => {
                        setIsSubmitting(false);
                        setBukaKameraPulang(false);
                        setCatatanLogbook("");
                    },

                    onError: (errors) => {
                        setIsSubmitting(false);

                        if (errors.error) {
                            alert(errors.error);
                        }
                    },
                },
            );
        },
        [koordinat, isLocationReady, catatanLogbook],
    );

    // =========================================================
    // DATA KARYAWAN
    // =========================================================

    const nama = karyawan?.nama_lengkap || auth?.user?.name || "Karyawan";

    const jabatan = karyawan?.jabatan?.nama_jabatan || null;
    const departemen = karyawan?.departemen?.nama_departemen || null;

    // =========================================================
    // STATUS BADGE
    // =========================================================

    const getStatusBadge = () => {
        if (statusAbsensi === "Cuti") {
            return {
                label: "Cuti",
                className: "bg-purple-50 text-purple-700 border-purple-200",
            };
        }

        if (statusAbsensi === "Izin") {
            return {
                label: "Izin",
                className: "bg-amber-50 text-amber-700 border-amber-200",
            };
        }

        if (statusAbsensi === "Alpha") {
            return {
                label: "Alpha",
                className: "bg-red-50 text-red-700 border-red-200",
            };
        }

        if (statusAbsensi === "Dinas Luar") {
            return {
                label: "Dinas Luar",
                className: "bg-blue-50 text-blue-700 border-blue-200",
            };
        }

        if (statusAbsensi === "Terlambat") {
            return {
                label: "Terlambat",
                className: "bg-orange-50 text-orange-700 border-orange-200",
            };
        }

        if (statusAbsensi === "Hadir") {
            return {
                label: "Hadir",
                className: "bg-emerald-50 text-emerald-700 border-emerald-200",
            };
        }

        return {
            label: "Belum Absen",
            className: "bg-gray-50 text-gray-600 border-gray-200",
        };
    };

    const badge = getStatusBadge();

    // =========================================================
    // ICONS
    // =========================================================

    const ClockIcon = ({ className = "w-5 h-5" }) => (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="M12 7v5l3 2" />
        </svg>
    );

    const CameraIcon = ({ className = "w-5 h-5" }) => (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <circle cx="12" cy="13" r="3" strokeWidth={2} />
        </svg>
    );

    const LocationIcon = ({ className = "w-5 h-5" }) => (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z"
            />
            <circle cx="12" cy="10" r="2.5" strokeWidth={2} />
        </svg>
    );

    const DashboardIcon = ({ className = "w-5 h-5" }) => (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4 13h6V4H4v9zm10 7h6v-9h-6v9zM4 20h6v-3H4v3zm10-11h6V4h-6v5z"
            />
        </svg>
    );

    // =========================================================
    // RETURN
    // =========================================================

    return (
        <AuthenticatedLayout>
            <Head title="Absensi Kehadiran" />

            <div className="min-h-screen bg-[#F7F7FA]">
                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="bg-gradient-to-r from-[#2A164E] to-[#431D6D]">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="relative flex min-h-[76px] items-center justify-center py-4">
                            {/* JUDUL TENGAH */}
                            <div className="text-center">
                                <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F3B817] sm:block">
                                    LDP HRIS
                                </p>

                                <h1 className="text-base font-bold leading-tight text-white sm:text-xl">
                                    Absensi Kehadiran
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    CONTENT
                ====================================================== */}

                <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                    {/* =================================================
                        NON ATTENDANCE
                    ================================================== */}

                    {statusNonKehadiran && (
                        <div className="mx-auto max-w-xl">
                            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="h-1 bg-gradient-to-r from-[#2A164E] to-[#431D6D]" />

                                <div className="px-5 py-9 text-center sm:px-8 sm:py-11">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3B817]/15 text-[#2A164E]">
                                        <svg
                                            className="h-6 w-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>

                                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                                        Status Kehadiran
                                    </p>

                                    <h2 className="mt-1.5 text-xl font-bold text-[#2A164E]">
                                        {statusAbsensi}
                                    </h2>

                                    <p className="mt-3 text-sm leading-relaxed text-gray-500">
                                        Anda tidak perlu melakukan Clock In
                                        maupun Clock Out untuk hari ini.
                                    </p>

                                    <span
                                        className={`mt-5 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${badge.className}`}
                                    >
                                        {badge.label}
                                    </span>

                                    <Link
                                        href={route("dashboard")}
                                        className="mt-7 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#2A164E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#431D6D] sm:w-auto"
                                    >
                                        Kembali ke Dashboard
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =================================================
                        NORMAL ATTENDANCE
                    ================================================== */}

                    {!statusNonKehadiran && (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-7">
                            {/* =================================================
                                MOBILE TIME
                            ================================================== */}

                            <div className="lg:hidden">
                                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                                                Waktu Sekarang
                                            </p>

                                            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                                                {formatTanggal(waktu)}
                                            </p>
                                        </div>

                                        <p className="shrink-0 text-2xl font-bold tracking-tight text-[#2A164E] tabular-nums">
                                            {jamStr}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* =================================================
    CAMERA
================================================== */}

                            <div className="lg:col-span-3">
                                {!sudahKeluar && (
                                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        {/* HEADER CAMERA */}

                                        <div className="border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#431D6D]">
                                                        Verifikasi Kehadiran
                                                    </p>

                                                    <h2 className="mt-1 text-base font-bold text-[#2A164E] sm:text-lg">
                                                        {sudahMasuk
                                                            ? "Clock Out"
                                                            : "Clock In"}
                                                    </h2>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-1.5">
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${
                                                            isLocationReady
                                                                ? "bg-emerald-500"
                                                                : "animate-pulse bg-amber-500"
                                                        }`}
                                                    />

                                                    <span className="text-[10px] font-semibold text-gray-500 sm:text-[11px]">
                                                        {isLocationReady
                                                            ? "GPS Aktif"
                                                            : "Menunggu"}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="mt-2 text-xs leading-relaxed text-gray-500 sm:text-sm">
                                                Pastikan kamera dan lokasi aktif
                                                sebelum melakukan absensi.
                                            </p>
                                        </div>

                                        {/* CAMERA */}

                                        <div className="p-3.5 sm:p-5">
                                            {(!sudahMasuk ||
                                                (sudahMasuk &&
                                                    !sudahKeluar &&
                                                    bukaKameraPulang)) && (
                                                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#2A164E] sm:rounded-2xl">
                                                    <Webcam
                                                        audio={false}
                                                        ref={webcamRef}
                                                        screenshotFormat="image/jpeg"
                                                        screenshotQuality={0.6}
                                                        videoConstraints={{
                                                            width: 640,
                                                            height: 480,
                                                            facingMode: "user",
                                                        }}
                                                        className="h-full w-full object-cover"
                                                    />

                                                    <div className="pointer-events-none absolute inset-0">
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="h-44 w-32 rounded-[50%] border-2 border-white/50 sm:h-56 sm:w-44 md:h-60 md:w-48" />
                                                        </div>

                                                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/45 px-2.5 py-1.5 backdrop-blur-sm sm:left-4 sm:top-4">
                                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />

                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-white sm:text-[10px]">
                                                                Live
                                                            </span>
                                                        </div>

                                                        <div className="absolute bottom-3 left-1/2 max-w-[85%] -translate-x-1/2">
                                                            <div className="rounded-lg bg-black/50 px-3 py-1.5 text-center backdrop-blur-sm">
                                                                <span className="text-[10px] font-medium text-white/90 sm:text-[11px]">
                                                                    Posisikan
                                                                    wajah di
                                                                    tengah
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* SUDAH CLOCK IN */}

                                            {sudahMasuk &&
                                                !sudahKeluar &&
                                                !bukaKameraPulang && (
                                                    <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-gray-200 bg-[#F7F7FA] px-5 text-center sm:rounded-2xl">
                                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2A164E]/10 text-[#2A164E]">
                                                            <ClockIcon className="h-7 w-7" />
                                                        </div>

                                                        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                                                            Status Kerja
                                                        </p>

                                                        <h3 className="mt-1 text-lg font-bold text-[#2A164E]">
                                                            Anda sedang bekerja
                                                        </h3>

                                                        <p className="mt-2 max-w-sm text-xs leading-relaxed text-gray-500 sm:text-sm">
                                                            Clock In Anda sudah
                                                            tercatat. Buka
                                                            kamera Clock Out
                                                            ketika selesai
                                                            bekerja.
                                                        </p>
                                                    </div>
                                                )}

                                            {/* ACTION AREA */}

                                            <div className="mt-4 space-y-2.5 sm:mt-5">
                                                {/* CLOCK IN */}

                                                {!sudahMasuk && (
                                                    <button
                                                        onClick={() =>
                                                            handleAbsen("masuk")
                                                        }
                                                        disabled={
                                                            !isLocationReady ||
                                                            isSubmitting
                                                        }
                                                        className={`flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold transition-all ${
                                                            !isLocationReady ||
                                                            isSubmitting
                                                                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                                                                : "bg-[#2A164E] text-white hover:bg-[#431D6D] active:scale-[0.99]"
                                                        }`}
                                                    >
                                                        <CameraIcon className="h-5 w-5 text-[#F3B817]" />

                                                        {isSubmitting
                                                            ? "Merekam Kehadiran..."
                                                            : "Clock In"}
                                                    </button>
                                                )}

                                                {/* BUKA KAMERA CLOCK OUT */}

                                                {sudahMasuk &&
                                                    !sudahKeluar &&
                                                    !bukaKameraPulang && (
                                                        <button
                                                            onClick={() =>
                                                                setBukaKameraPulang(
                                                                    true,
                                                                )
                                                            }
                                                            className="flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#2A164E] text-sm font-semibold text-white transition-all hover:bg-[#431D6D] active:scale-[0.99]"
                                                        >
                                                            <CameraIcon className="h-5 w-5 text-[#F3B817]" />
                                                            Buka Kamera Clock
                                                            Out
                                                        </button>
                                                    )}

                                                {/* CLOCK OUT FORM */}

                                                {sudahMasuk &&
                                                    !sudahKeluar &&
                                                    bukaKameraPulang && (
                                                        <div className="space-y-3.5">
                                                            <div>
                                                                <div className="mb-2 flex items-center justify-between">
                                                                    <label className="text-sm font-semibold text-[#2A164E]">
                                                                        Catatan
                                                                        Logbook
                                                                    </label>

                                                                    <span className="text-[10px] text-gray-400">
                                                                        Opsional
                                                                    </span>
                                                                </div>

                                                                <textarea
                                                                    rows="4"
                                                                    value={
                                                                        catatanLogbook
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setCatatanLogbook(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    placeholder="Ringkasan tugas/kendala hari ini (Wajib bagi tim NOC)..."
                                                                    className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#431D6D] focus:ring-2 focus:ring-[#431D6D]/10"
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-2.5">
                                                                <button
                                                                    onClick={() =>
                                                                        setBukaKameraPulang(
                                                                            false,
                                                                        )
                                                                    }
                                                                    className="min-h-[48px] rounded-xl bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                                                                >
                                                                    Batal
                                                                </button>

                                                                <button
                                                                    onClick={() =>
                                                                        handleAbsen(
                                                                            "keluar",
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        !isLocationReady ||
                                                                        isSubmitting
                                                                    }
                                                                    className={`col-span-2 flex min-h-[48px] items-center justify-center gap-2 rounded-xl text-sm font-semibold ${
                                                                        !isLocationReady ||
                                                                        isSubmitting
                                                                            ? "cursor-not-allowed bg-gray-200 text-gray-400"
                                                                            : "bg-[#2A164E] text-white hover:bg-[#431D6D]"
                                                                    }`}
                                                                >
                                                                    <CameraIcon className="h-4 w-4 text-[#F3B817]" />

                                                                    {isSubmitting
                                                                        ? "Memproses..."
                                                                        : "Clock Out"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* KEMBALI KE DASHBOARD
                        HANYA SEBELUM ABSENSI SELESAI */}

                                                {!sudahKeluar && (
                                                    <Link
                                                        href={route(
                                                            "dashboard",
                                                        )}
                                                        className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#2A164E]/15 bg-white text-sm font-semibold text-[#2A164E] transition hover:border-[#431D6D]/30 hover:bg-[#2A164E]/5"
                                                    >
                                                        <DashboardIcon className="h-4 w-4" />
                                                        Kembali ke Dashboard
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* =================================================
        SUCCESS
    ================================================== */}

                                {sudahKeluar && (
                                    <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A164E] to-[#431D6D] p-5 shadow-sm sm:p-6">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F3B817] text-[#2A164E]">
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="flex-1">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#F3B817]">
                                                    Absensi Selesai
                                                </p>

                                                <h3 className="mt-1 text-base font-bold text-white sm:text-lg">
                                                    Kehadiran hari ini telah
                                                    tercatat
                                                </h3>

                                                <p className="mt-1 text-xs text-white/65 sm:text-sm">
                                                    Clock In dan Clock Out
                                                    berhasil disimpan.
                                                </p>
                                            </div>

                                            <Link
                                                href={route("dashboard")}
                                                className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#F3B817] px-4 py-2.5 text-sm font-bold text-[#2A164E] transition hover:bg-[#e3a914] sm:w-auto"
                                            >
                                                <DashboardIcon className="h-4 w-4" />
                                                Kembali ke Dashboard
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* =================================================
                                INFORMATION
                            ================================================== */}

                            <div className="lg:col-span-2">
                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:sticky lg:top-6">
                                    {/* TIME DESKTOP */}

                                    <div className="hidden px-6 py-6 lg:block">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                                            Waktu Sekarang
                                        </p>

                                        <p className="mt-2 text-4xl font-bold tracking-tight text-[#2A164E] tabular-nums">
                                            {jamStr}
                                        </p>

                                        <p className="mt-1.5 text-xs text-gray-500">
                                            {formatTanggal(waktu)}
                                        </p>
                                    </div>

                                    <div className="hidden h-px bg-gray-100 lg:block" />

                                    {/* EMPLOYEE */}

                                    <div className="px-4 py-4 sm:px-6 sm:py-5">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2A164E]/10 text-[#2A164E]">
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 19a4 4 0 00-6 0m3-7a4 4 0 100-8 4 4 0 000 8zm8 8a8 8 0 10-16 0"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                                                    Karyawan
                                                </p>

                                                <p className="mt-1 truncate text-sm font-bold text-[#2A164E]">
                                                    {nama}
                                                </p>

                                                {jabatan && (
                                                    <p className="mt-0.5 text-xs text-gray-500">
                                                        {jabatan}
                                                    </p>
                                                )}

                                                {departemen && (
                                                    <p className="text-xs text-gray-500">
                                                        {departemen}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100" />

                                    {/* ATTENDANCE */}

                                    <div className="px-4 py-4 sm:px-6 sm:py-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                                                Status Hari Ini
                                            </p>

                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badge.className}`}
                                            >
                                                {badge.label}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${
                                                            sudahMasuk
                                                                ? "bg-emerald-500"
                                                                : "bg-gray-300"
                                                        }`}
                                                    />

                                                    <span className="text-sm text-gray-600">
                                                        Clock In
                                                    </span>
                                                </div>

                                                <span
                                                    className={`text-sm font-semibold tabular-nums ${
                                                        sudahMasuk
                                                            ? "text-[#2A164E]"
                                                            : "text-gray-400"
                                                    }`}
                                                >
                                                    {sudahMasuk
                                                        ? formatJam(
                                                              absensiHariIni?.waktu_masuk,
                                                          )
                                                        : "--:--"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${
                                                            sudahKeluar
                                                                ? "bg-emerald-500"
                                                                : "bg-gray-300"
                                                        }`}
                                                    />

                                                    <span className="text-sm text-gray-600">
                                                        Clock Out
                                                    </span>
                                                </div>

                                                <span
                                                    className={`text-sm font-semibold tabular-nums ${
                                                        sudahKeluar
                                                            ? "text-[#2A164E]"
                                                            : "text-gray-400"
                                                    }`}
                                                >
                                                    {sudahKeluar
                                                        ? formatJam(
                                                              absensiHariIni?.waktu_keluar,
                                                          )
                                                        : "--:--"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100" />

                                    {/* GPS */}

                                    <div className="px-4 py-4 sm:px-6 sm:py-5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A164E]/10 text-[#431D6D]">
                                                    <LocationIcon className="h-4 w-4" />
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
                                                        Lokasi
                                                    </p>

                                                    <p className="text-xs font-semibold text-[#2A164E]">
                                                        GPS Absensi
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        isLocationReady
                                                            ? "bg-emerald-500"
                                                            : "animate-pulse bg-amber-500"
                                                    }`}
                                                />

                                                <span
                                                    className={`text-[10px] font-semibold ${
                                                        isLocationReady
                                                            ? "text-emerald-600"
                                                            : "text-amber-600"
                                                    }`}
                                                >
                                                    {isLocationReady
                                                        ? "Aktif"
                                                        : "Menunggu"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 rounded-xl border border-gray-100 bg-[#F7F7FA] px-3 py-2.5">
                                            <p className="text-xs leading-relaxed text-gray-500">
                                                {statusLokasi}
                                            </p>

                                            {isLocationReady && (
                                                <p className="mt-1.5 break-all font-mono text-[10px] text-gray-400">
                                                    {koordinat}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AuthenticatedLayout>
    );
}
