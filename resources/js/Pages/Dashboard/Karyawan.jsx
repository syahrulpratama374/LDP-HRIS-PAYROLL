import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import LogoLDP from "@/Assets/LogoLDP.png";

export default function Karyawan({
    auth,
    sisaCuti = 0,
    sisaKasbon = 0,
    pengumuman = [],
    absensiHariIni = null,
    statistikBulanIni = {},
    absensiMingguIni = [],
}) {
    // =========================================================
    // FORMAT
    // =========================================================

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(angka || 0);
    };

    const sekarang = new Date();

    const tanggalHariIni = sekarang.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const jam = sekarang.getHours();

    const sapaan =
        jam < 11
            ? "Selamat pagi"
            : jam < 15
              ? "Selamat siang"
              : jam < 18
                ? "Selamat sore"
                : "Selamat malam";

    // =========================================================
    // ROLE
    // =========================================================

    const roleId = auth?.user?.role_id;
    const isPengelolaPengumuman = [1, 2, 3].includes(roleId);

    // =========================================================
    // STATUS ABSENSI HARI INI
    // =========================================================

    const sudahMasuk = Boolean(absensiHariIni?.waktu_masuk);
    const sudahKeluar = Boolean(absensiHariIni?.waktu_keluar);

    const statusHariIni = sudahKeluar
        ? "Selesai"
        : sudahMasuk
          ? "Sedang Bekerja"
          : "Belum Absen";

    const formatJam = (waktu) => {
        if (!waktu) return "--:--";

        try {
            // Trik 1: Coba baca secara normal
            let date = new Date(waktu);

            // Trik 2: Jika browser kaku, ganti spasi dengan T (Format ISO)
            if (Number.isNaN(date.getTime()) && typeof waktu === "string") {
                date = new Date(waktu.replace(" ", "T"));
            }

            if (!Number.isNaN(date.getTime())) {
                return date.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
            }

            // Trik 3: Jika masih gagal (Senjata Pamungkas), potong string manual
            const match = String(waktu).match(/(\d{2}):(\d{2})/);
            if (match) {
                return `${match[1]}:${match[2]}`;
            }

            return "--:--";
        } catch (e) {
            return "--:--";
        }
    };

    // =========================================================
    // STATISTIK BULAN INI
    // =========================================================

    const stat = {
        hadir: 0,
        terlambat: 0,
        izin: 0,
        alpha: 0,
        ...statistikBulanIni,
    };

    // =========================================================
    // 7 HARI TERAKHIR
    // =========================================================

    const keyOf = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate(),
        ).padStart(2, "0")}`;

    const hariMinggu = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(sekarang);
        d.setDate(d.getDate() - (6 - i));
        return d;
    });

    const mapAbsensi = (() => {
        const m = {};

        (absensiMingguIni || []).forEach((a) => {
            const key = a?.tanggal ? String(a.tanggal).slice(0, 10) : "";

            if (key) {
                m[key] = a;
            }
        });

        return m;
    })();

    const statusStyle = {
        hadir: {
            box: "bg-emerald-400/90 border-emerald-300/40 text-emerald-950",
            label: "Hadir",
        },
        terlambat: {
            box: "bg-amber-400/90 border-amber-300/40 text-amber-950",
            label: "Terlambat",
        },
        izin: {
            box: "bg-sky-400/90 border-sky-300/40 text-sky-950",
            label: "Izin",
        },
        cuti: {
            box: "bg-violet-300/90 border-violet-200/40 text-violet-950",
            label: "Cuti",
        },
        "dinas luar": {
            box: "bg-blue-400/90 border-blue-300/40 text-blue-950",
            label: "Dinas Luar",
        },
        alpha: {
            box: "bg-rose-500/80 border-rose-400/40 text-white",
            label: "Alpha",
        },
    };

    const defaultStyle = {
        box: "bg-white/5 border-white/10 text-purple-200",
        label: "-",
    };

    // =========================================================
    // PENGUMUMAN
    // =========================================================

    const pengumumanTerurut = [...(pengumuman || [])].sort((a, b) => {
        const prioritas = {
            Peringatan: 1,
            Info: 2,
            Sukses: 3,
        };

        const pa = prioritas[a.tipe_banner] || 99;
        const pb = prioritas[b.tipe_banner] || 99;

        if (pa !== pb) return pa - pb;

        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    // =========================================================
    // USER
    // =========================================================

    const jabatan = auth?.user?.jabatan || auth?.user?.role?.name || "Karyawan";

    // =========================================================
    // ICON
    // =========================================================

    const Icon = ({ name, className = "w-5 h-5" }) => {
        const common = {
            className,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            strokeWidth: "1.7",
        };

        switch (name) {
            case "attendance":
                return (
                    <svg {...common}>
                        <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
                        <path strokeLinecap="round" d="M9 3.5V6h6V3.5" />
                        <path strokeLinecap="round" d="M9 11h6M9 14.5h4" />
                        <circle cx="16.5" cy="17" r="1.5" />
                    </svg>
                );

            case "leave":
                return (
                    <svg {...common}>
                        <rect x="4" y="5" width="16" height="15" rx="2" />
                        <path strokeLinecap="round" d="M8 3v4M16 3v4M4 9h16" />
                        <path strokeLinecap="round" d="M8 13h3M8 16h5" />
                    </svg>
                );

            case "overtime":
                return (
                    <svg {...common}>
                        <circle cx="12" cy="12" r="8.5" />
                        <path strokeLinecap="round" d="M12 7.5V12l3.5 2" />
                        <path strokeLinecap="round" d="M17.5 4.5l2 2" />
                    </svg>
                );

            case "travel":
                return (
                    <svg {...common}>
                        <rect x="5" y="7" width="14" height="12" rx="2" />
                        <path
                            strokeLinecap="round"
                            d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7"
                        />
                        <path strokeLinecap="round" d="M5 11h14M9 14h6" />
                    </svg>
                );

            case "loan":
                return (
                    <svg {...common}>
                        <rect x="3.5" y="6" width="17" height="12" rx="2" />
                        <path strokeLinecap="round" d="M3.5 10h17" />
                        <circle cx="12" cy="14.5" r="1.8" />
                    </svg>
                );

            case "document":
                return (
                    <svg {...common}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 3.5h7l4 4V20H7a2 2 0 01-2-2V5.5a2 2 0 012-2z"
                        />
                        <path
                            strokeLinecap="round"
                            d="M14 3.5V8h4M9 12h6M9 15.5h6"
                        />
                    </svg>
                );

            case "bell":
                return (
                    <svg {...common}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 8a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"
                        />
                        <path strokeLinecap="round" d="M10 21h4" />
                    </svg>
                );

            case "clock":
                return (
                    <svg {...common}>
                        <circle cx="12" cy="12" r="8.5" />
                        <path strokeLinecap="round" d="M12 7v5l3 1.8" />
                    </svg>
                );

            case "check":
                return (
                    <svg {...common}>
                        <circle cx="12" cy="12" r="8.5" />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.5 12.2l2.4 2.4 4.6-5"
                        />
                    </svg>
                );

            case "alert":
                return (
                    <svg {...common}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5l8 14H4l8-14z"
                        />
                        <path strokeLinecap="round" d="M12 10v4M12 16.8v.2" />
                    </svg>
                );

            case "chart":
                return (
                    <svg {...common}>
                        <path strokeLinecap="round" d="M4 20h16" />
                        <path
                            strokeLinecap="round"
                            d="M7 20v-6M12 20V8M17 20v-9"
                        />
                    </svg>
                );

            case "sparkle":
                return (
                    <svg {...common}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z"
                        />
                        <path
                            strokeLinecap="round"
                            d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"
                        />
                    </svg>
                );

            case "pin":
                return (
                    <svg {...common}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 21s6.5-5.3 6.5-10a6.5 6.5 0 10-13 0C5.5 15.7 12 21 12 21z"
                        />
                        <circle cx="12" cy="11" r="2.4" />
                    </svg>
                );

            case "ticket":
                return (
                    <svg {...common}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 8.5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4v-2z"
                        />
                        <path
                            strokeLinecap="round"
                            d="M12 7v2M12 12v1M12 15v2"
                        />
                    </svg>
                );

            case "calendar":
                return (
                    <svg {...common}>
                        <rect x="4" y="5" width="16" height="15" rx="2" />
                        <path strokeLinecap="round" d="M8 3v4M16 3v4M4 9h16" />
                    </svg>
                );

            case "wallet":
                return (
                    <svg {...common}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 6h13a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
                        />
                        <path strokeLinecap="round" d="M5 6V5a2 2 0 012-2h10" />
                        <path strokeLinecap="round" d="M15 14h5" />
                    </svg>
                );

            default:
                return null;
        }
    };

    // =========================================================
    // QUICK ACCESS
    // =========================================================

    const quickAccess = [
        {
            number: "01",
            label: "Absensi",
            description: sudahKeluar
                ? "Kehadiran selesai"
                : sudahMasuk
                  ? "Menunggu clock out"
                  : "Kehadiran hari ini",
            href: route("absensi.create"),
            icon: "attendance",
            iconStyle: "bg-[#F0E4F7] text-[#6D1AA8]",
        },
        {
            number: "02",
            label: "Cuti",
            description: "Buat pengajuan cuti",
            href: route("cuti.create"),
            icon: "leave",
            iconStyle: "bg-emerald-50 text-emerald-600",
        },
        {
            number: "03",
            label: "Lembur",
            description: "Buat pengajuan lembur",
            href: route("lembur.create"),
            icon: "overtime",
            iconStyle: "bg-violet-50 text-violet-600",
        },
        {
            number: "04",
            label: "SPJ / Perjalanan",
            description: "Ajukan perjalanan dinas",
            href: route("spj.create"),
            icon: "travel",
            iconStyle: "bg-blue-50 text-blue-600",
        },
        {
            number: "05",
            label: "Kasbon",
            description: "Ajukan pinjaman",
            href: route("pinjaman.create"),
            icon: "loan",
            iconStyle: "bg-amber-50 text-amber-600",
        },
        {
            number: "06",
            label: "IT Ticket",
            description: "Laporkan kendala IT",
            href: route("ticket.index"),
            icon: "ticket",
            iconStyle: "bg-sky-50 text-sky-600",
        },
        {
            number: "07",
            label: "Slip Gaji",
            description: "Riwayat penggajian",
            href: route("slip.index"),
            icon: "document",
            iconStyle: "bg-rose-50 text-rose-600",
        },
    ];

    // =========================================================
    // STAT CARDS
    // =========================================================

    const statCards = [
        {
            label: "Hadir",
            value: stat.hadir,
            suffix: "hari",
            icon: "check",
            iconStyle: "bg-emerald-50 text-emerald-600",
            accent: "bg-emerald-500",
        },
        {
            label: "Terlambat",
            value: stat.terlambat,
            suffix: "kali",
            icon: "clock",
            iconStyle: "bg-amber-50 text-amber-600",
            accent: "bg-amber-500",
        },
        {
            label: "Izin",
            value: stat.izin,
            suffix: "hari",
            icon: "alert",
            iconStyle: "bg-sky-50 text-sky-600",
            accent: "bg-sky-500",
        },
        {
            label: "Alpha",
            value: stat.alpha,
            suffix: "hari",
            icon: "alert",
            iconStyle: "bg-rose-50 text-rose-600",
            accent: "bg-rose-500",
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Karyawan" />

            <div className="min-h-screen bg-[#F7F7FA]">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                    {/* =====================================================
                        1. HERO
                    ====================================================== */}

                    <section className="mb-6 sm:mb-8">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3A0D59] via-[#521480] to-[#6D1AA8] text-white shadow-xl shadow-[#421065]/10">
                            <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full border border-white/10" />
                            <div className="pointer-events-none absolute -right-6 -top-12 h-52 w-52 rounded-full border border-white/10" />
                            <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#8B4BB3]/25 blur-3xl" />
                            <div className="pointer-events-none absolute right-1/4 top-1/2 h-40 w-40 rounded-full bg-[#F4B400]/15 blur-3xl" />

                            <div
                                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                                style={{
                                    backgroundImage:
                                        "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                                    backgroundSize: "38px 38px",
                                }}
                            />

                            <div className="relative z-10 grid gap-7 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-10">
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#F4B400]" />

                                        <span className="text-[10px] font-semibold tracking-wide text-purple-100 sm:text-[11px]">
                                            {sapaan}, semangat hari ini!
                                        </span>
                                    </div>

                                    <h1 className="mt-4 break-words text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                                        {auth.user.name}
                                    </h1>

                                    <p className="mt-2 max-w-xl text-xs leading-relaxed text-purple-200 sm:text-sm">
                                        Selamat datang kembali di{" "}
                                        <span className="font-semibold text-white">
                                            LDP HRIS &amp; Payroll
                                        </span>
                                        . Semua kebutuhan administrasi
                                        kepegawaianmu ada di satu tempat.
                                    </p>

                                    <div className="mt-5 flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-medium text-purple-100 backdrop-blur-sm sm:text-[11px]">
                                            <Icon
                                                name="calendar"
                                                className="h-3.5 w-3.5"
                                            />
                                            {tanggalHariIni}
                                        </span>

                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-medium text-purple-100 sm:text-[11px]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            Portal aktif
                                        </span>

                                        <span className="inline-flex items-center gap-2 rounded-full border border-[#F4B400]/25 bg-[#F4B400]/15 px-3 py-1.5 text-[10px] font-semibold text-[#F4B400] sm:text-[11px]">
                                            <Icon
                                                name="sparkle"
                                                className="h-3.5 w-3.5"
                                            />
                                            {statusHariIni}
                                        </span>
                                    </div>
                                </div>

                                {/* PROFIL */}
                                <div className="w-full">
                                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
                                        <div className="flex items-center gap-4">
                                            {/* LOGO LDP */}
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-black/10">
                                                <img
                                                    src={LogoLDP}
                                                    alt="Logo LDP"
                                                    className="h-full w-full object-contain"
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-white sm:text-base">
                                                    {auth.user.name}
                                                </p>

                                                <p className="truncate text-[11px] text-purple-200 sm:text-xs">
                                                    {jabatan}
                                                </p>
                                            </div>
                                        </div>

                                        {/* STATUS + CLOCK IN */}
                                        <div className="mt-4 grid grid-cols-2 gap-2.5">
                                            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                                                <p className="text-[8px] uppercase tracking-[0.15em] text-purple-300 sm:text-[9px]">
                                                    Status Hari Ini
                                                </p>

                                                <p className="mt-1 truncate text-xs font-bold text-white sm:text-sm">
                                                    {statusHariIni}
                                                </p>
                                            </div>

                                            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                                                <p className="text-[8px] uppercase tracking-[0.15em] text-purple-300 sm:text-[9px]">
                                                    Clock In
                                                </p>

                                                <p className="mt-1 text-xs font-bold text-white sm:text-sm">
                                                    {formatJam(
                                                        absensiHariIni?.waktu_masuk,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={route("absensi.create")}
                                            className="mt-3 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 text-xs font-semibold text-white transition hover:bg-white/20"
                                        >
                                            <Icon
                                                name="pin"
                                                className="h-4 w-4"
                                            />
                                            Buka Presensi
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        2. STATISTIK
                    ====================================================== */}

                    <section className="mb-8 sm:mb-9">
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {statCards.map((s) => (
                                <div
                                    key={s.label}
                                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#DCC8E8] hover:shadow-md"
                                >
                                    <span
                                        className={`absolute left-0 top-0 h-full w-1 ${s.accent} opacity-70`}
                                    />

                                    <div className="flex items-start justify-between">
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.iconStyle}`}
                                        >
                                            <Icon
                                                name={s.icon}
                                                className="h-[18px] w-[18px]"
                                            />
                                        </div>

                                        <Icon
                                            name="chart"
                                            className="h-4 w-4 text-slate-200 transition group-hover:text-[#C9A9D8]"
                                        />
                                    </div>

                                    <p className="mt-3 text-2xl font-bold text-slate-900">
                                        {s.value}

                                        <span className="ml-1 text-xs font-medium text-slate-400">
                                            {s.suffix}
                                        </span>
                                    </p>

                                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* =====================================================
                        3. PAPAN PENGUMUMAN
                    ====================================================== */}

                    <section className="mb-8 sm:mb-9">
                        <div className="mb-3 flex items-end justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F4B400]" />

                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#6D1AA8] sm:text-[10px]">
                                        Informasi LDP
                                    </p>

                                    <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                                        Papan Pengumuman
                                    </h2>
                                </div>
                            </div>

                            {isPengelolaPengumuman && (
                                <Link
                                    href={route("pengumuman.index")}
                                    className="whitespace-nowrap text-[11px] font-semibold text-[#6D1AA8] transition hover:text-[#421065] sm:text-xs"
                                >
                                    Kelola →
                                </Link>
                            )}
                        </div>

                        {pengumumanTerurut.length > 0 ? (
                            <div className="space-y-2.5">
                                {pengumumanTerurut
                                    .slice(0, 3)
                                    .map((item, index) => {
                                        const bannerStyle = {
                                            Peringatan: {
                                                dot: "bg-amber-500",
                                                badge: "bg-amber-50 text-amber-600",
                                                ring: "hover:border-amber-200",
                                            },
                                            Info: {
                                                dot: "bg-[#8B4BB3]",
                                                badge: "bg-[#F0E4F7] text-[#6D1AA8]",
                                                ring: "hover:border-[#DCC8E8]",
                                            },
                                            Sukses: {
                                                dot: "bg-emerald-500",
                                                badge: "bg-emerald-50 text-emerald-600",
                                                ring: "hover:border-emerald-200",
                                            },
                                        };

                                        const style =
                                            bannerStyle[item.tipe_banner] ||
                                            bannerStyle.Info;

                                        return (
                                            <article
                                                key={item.id}
                                                className={`group rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:bg-[#FCFAFD] sm:px-5 ${style.ring}`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0E4F7] text-[10px] font-bold text-[#6D1AA8] sm:flex">
                                                        0{index + 1}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1.5 flex items-center gap-2">
                                                            <span
                                                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
                                                            />

                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em] ${style.badge}`}
                                                            >
                                                                {item.tipe_banner ||
                                                                    "Info"}
                                                            </span>
                                                        </div>

                                                        <h3 className="text-sm font-bold leading-snug text-slate-900 sm:text-[15px]">
                                                            {item.judul}
                                                        </h3>

                                                        <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:line-clamp-2 sm:text-sm">
                                                            {item.konten}
                                                        </p>

                                                        <div className="mt-2.5 flex items-center gap-2 text-[10px] text-slate-400 sm:text-[11px]">
                                                            <span>
                                                                Oleh{" "}
                                                                <span className="font-semibold text-slate-500">
                                                                    {item
                                                                        .pembuat
                                                                        ?.name ||
                                                                        "HR"}
                                                                </span>
                                                            </span>

                                                            <span className="text-slate-300">
                                                                •
                                                            </span>

                                                            <span>
                                                                Informasi
                                                                perusahaan
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="self-center text-sm font-bold text-[#6D1AA8] opacity-60 transition group-hover:opacity-100">
                                                        →
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}

                                {isPengelolaPengumuman &&
                                    pengumumanTerurut.length > 3 && (
                                        <Link
                                            href={route("pengumuman.index")}
                                            className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#6D1AA8] transition hover:border-[#DCC8E8] hover:bg-[#F0E4F7]"
                                        >
                                            Lihat {pengumumanTerurut.length - 3}{" "}
                                            pengumuman lainnya →
                                        </Link>
                                    )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-white px-5 py-5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0E4F7] text-[#8B4BB3]">
                                    <Icon name="bell" className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-700">
                                        Belum ada pengumuman baru
                                    </h3>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Informasi terbaru dari perusahaan akan
                                        muncul di sini.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* =====================================================
                        4. KEHADIRAN
                    ====================================================== */}

                    <section className="mb-8 sm:mb-10">
                        <div className="relative overflow-hidden rounded-2xl bg-[#421065] text-white">
                            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10" />
                            <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full border border-white/10" />
                            <div className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-[#8B4BB3]/20 blur-3xl" />

                            <div className="relative z-10 px-5 py-6 sm:px-6 md:px-8 md:py-7">
                                <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_330px] lg:gap-8">
                                    <div className="min-w-0">
                                        <div className="mb-4 flex items-center gap-2">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#F4B400]" />

                                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-purple-200 sm:text-[10px]">
                                                Kehadiran Hari Ini
                                            </span>
                                        </div>

                                        {sudahKeluar ? (
                                            <>
                                                <h2 className="text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                                                    Absensi hari ini selesai.
                                                </h2>

                                                <p className="mt-2 max-w-xl text-xs leading-relaxed text-purple-200 sm:text-sm">
                                                    Kehadiran kamu hari ini
                                                    sudah tercatat lengkap.
                                                    Terima kasih atas kerja
                                                    kerasnya!
                                                </p>
                                            </>
                                        ) : sudahMasuk ? (
                                            <>
                                                <h2 className="text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                                                    Kamu sudah clock in.
                                                </h2>

                                                <p className="mt-2 max-w-xl text-xs leading-relaxed text-purple-200 sm:text-sm">
                                                    Selesaikan pekerjaan dan
                                                    lakukan clock out setelah
                                                    selesai.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
                                                    Belum melakukan presensi.
                                                </h2>

                                                <p className="mt-2 max-w-xl text-xs leading-relaxed text-purple-200 sm:text-sm">
                                                    Pastikan kamu berada di area
                                                    kerja sebelum melakukan
                                                    absensi.
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    <div className="w-full">
                                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                            <div className="min-w-0 rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                                                <p className="truncate text-[8px] uppercase tracking-[0.15em] text-purple-300 sm:text-[9px]">
                                                    Clock In
                                                </p>

                                                <p className="mt-1 text-lg font-bold sm:text-xl">
                                                    {formatJam(
                                                        absensiHariIni?.waktu_masuk,
                                                    )}
                                                </p>
                                            </div>

                                            <div className="min-w-0 rounded-xl border border-white/10 bg-white/10 px-3 py-3 sm:px-4">
                                                <p className="truncate text-[8px] uppercase tracking-[0.15em] text-purple-300 sm:text-[9px]">
                                                    Clock Out
                                                </p>

                                                <p className="mt-1 text-lg font-bold sm:text-xl">
                                                    {formatJam(
                                                        absensiHariIni?.waktu_keluar,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            {!sudahKeluar ? (
                                                <Link
                                                    href={route(
                                                        "absensi.create",
                                                    )}
                                                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#F4B400] text-xs font-bold text-[#421065] transition hover:bg-[#e5a900] sm:min-h-[48px] sm:text-sm"
                                                >
                                                    {sudahMasuk
                                                        ? "Clock Out →"
                                                        : "Absen Sekarang →"}
                                                </Link>
                                            ) : (
                                                <div className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 text-xs font-semibold text-purple-100 sm:min-h-[48px] sm:text-sm">
                                                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                                                    Kehadiran sudah lengkap
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 7 HARI TERAKHIR */}
                                <div className="mt-7 border-t border-white/10 pt-5">
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-purple-200 sm:text-[10px]">
                                            7 Hari Terakhir
                                        </p>

                                        <div className="hidden items-center gap-3 sm:flex">
                                            {[
                                                {
                                                    c: "bg-emerald-400",
                                                    l: "Hadir",
                                                },
                                                {
                                                    c: "bg-amber-400",
                                                    l: "Terlambat",
                                                },
                                                {
                                                    c: "bg-sky-400",
                                                    l: "Izin",
                                                },
                                                {
                                                    c: "bg-rose-400",
                                                    l: "Alpha",
                                                },
                                            ].map((lg) => (
                                                <span
                                                    key={lg.l}
                                                    className="inline-flex items-center gap-1.5 text-[10px] text-purple-300"
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${lg.c}`}
                                                    />
                                                    {lg.l}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                                        {hariMinggu.map((d, i) => {
                                            const key = keyOf(d);
                                            const rec = mapAbsensi[key];

                                            const status = (
                                                rec?.status || ""
                                            ).toLowerCase();

                                            const style =
                                                statusStyle[status] ||
                                                defaultStyle;

                                            const namaHari =
                                                d.toLocaleDateString("id-ID", {
                                                    weekday: "short",
                                                });

                                            const isToday =
                                                key === keyOf(sekarang);

                                            return (
                                                <div
                                                    key={i}
                                                    className="flex flex-col items-center gap-1.5"
                                                >
                                                    <span
                                                        className={`text-[8px] uppercase tracking-wider sm:text-[9px] ${
                                                            isToday
                                                                ? "font-bold text-[#F4B400]"
                                                                : "text-purple-300"
                                                        }`}
                                                    >
                                                        {namaHari}
                                                    </span>

                                                    <div
                                                        title={
                                                            rec?.status ||
                                                            "Belum ada data"
                                                        }
                                                        className={`flex h-9 w-full items-center justify-center rounded-xl border text-[11px] font-bold transition sm:h-10 sm:text-xs ${style.box} ${
                                                            isToday
                                                                ? "ring-2 ring-[#F4B400]/60 ring-offset-2 ring-offset-[#421065]"
                                                                : ""
                                                        }`}
                                                    >
                                                        {d.getDate()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* =====================================================
                        5. AKSES CEPAT
                    ====================================================== */}

                    <section className="mb-10">
                        <div className="mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6D1AA8]">
                                Navigasi
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-slate-900">
                                Akses Cepat
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {quickAccess.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="group relative h-[158px] overflow-hidden rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#C9A9D8] hover:shadow-md"
                                >
                                    <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#F0E4F7]/0 transition group-hover:bg-[#F0E4F7]/60" />

                                    <div className="relative flex items-start justify-between">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconStyle}`}
                                        >
                                            <Icon
                                                name={item.icon}
                                                className="h-5 w-5"
                                            />
                                        </div>

                                        <span className="text-[9px] font-bold tracking-widest text-slate-300">
                                            {item.number}
                                        </span>
                                    </div>

                                    <div className="relative mt-5">
                                        <p className="text-sm font-bold text-slate-800">
                                            {item.label}
                                        </p>

                                        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div className="relative mt-4 text-xs text-slate-300 transition group-hover:text-[#6D1AA8]">
                                        Buka →
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* =====================================================
                        6. STATUS SAYA
                    ====================================================== */}

                    <section>
                        <div className="mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6D1AA8]">
                                Ringkasan
                            </p>

                            <h2 className="mt-1 text-xl font-bold text-slate-900">
                                Status Saya
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {/* CUTI */}
                            <Link
                                href={route("cuti.index")}
                                className="group relative h-[176px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                            >
                                <span className="absolute right-0 top-0 h-24 w-24 rounded-bl-[80px] bg-emerald-50/70" />

                                <div className="relative flex items-start justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Cuti Tahunan
                                        </p>

                                        <p className="mt-3 text-3xl font-bold text-slate-900">
                                            {sisaCuti}
                                            <span className="ml-1 text-sm font-medium text-slate-400">
                                                hari
                                            </span>
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Sisa hak cuti
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                        <Icon
                                            name="calendar"
                                            className="h-5 w-5"
                                        />
                                    </div>
                                </div>

                                <div className="absolute inset-x-6 bottom-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <span className="text-xs font-bold text-emerald-600">
                                        Kelola cuti
                                    </span>

                                    <span className="text-xs font-bold text-emerald-600 transition group-hover:translate-x-1">
                                        →
                                    </span>
                                </div>
                            </Link>

                            {/* KASBON */}
                            <Link
                                href={route("pinjaman.index")}
                                className="group relative h-[176px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
                            >
                                <span className="absolute right-0 top-0 h-24 w-24 rounded-bl-[80px] bg-amber-50/70" />

                                <div className="relative flex items-start justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Kasbon
                                        </p>

                                        <p className="mt-3 text-2xl font-bold text-slate-900">
                                            {formatRupiah(sisaKasbon)}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Sisa limit pinjaman
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                        <Icon
                                            name="wallet"
                                            className="h-5 w-5"
                                        />
                                    </div>
                                </div>

                                <div className="absolute inset-x-6 bottom-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <span className="text-xs font-bold text-amber-600">
                                        Kelola pinjaman
                                    </span>

                                    <span className="text-xs font-bold text-amber-600 transition group-hover:translate-x-1">
                                        →
                                    </span>
                                </div>
                            </Link>

                            {/* SLIP GAJI */}
                            <Link
                                href={route("slip.index")}
                                className="group relative h-[176px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#421065] to-[#6D1AA8] p-6 text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#421065]/20"
                            >
                                <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
                                <span className="absolute -right-2 -top-2 h-20 w-20 rounded-full border border-white/10" />

                                <div className="relative flex items-start justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300">
                                            Payroll
                                        </p>

                                        <p className="mt-3 text-xl font-bold">
                                            Slip Gaji
                                        </p>

                                        <p className="mt-1 text-xs text-purple-300">
                                            Riwayat dokumen penggajian
                                        </p>
                                    </div>

                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-[#F4B400]">
                                        <Icon
                                            name="document"
                                            className="h-5 w-5"
                                        />
                                    </div>
                                </div>

                                <div className="absolute inset-x-6 bottom-5 flex items-center justify-between border-t border-white/10 pt-4">
                                    <span className="text-xs font-bold text-[#F4B400]">
                                        Lihat slip gaji
                                    </span>

                                    <span className="text-xs font-bold text-[#F4B400] transition group-hover:translate-x-1">
                                        →
                                    </span>
                                </div>
                            </Link>
                        </div>
                    </section>

                    {/* FOOTER */}

                    <div className="mt-10 flex flex-col items-center justify-center gap-2 border-t border-slate-200 pt-6 text-center">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#8B4BB3]" />

                            <span className="font-semibold text-slate-500">
                                LDP HRIS &amp; Payroll
                            </span>
                        </div>

                        <p className="text-[10px] text-slate-400">
                            Butuh bantuan? Hubungi tim HR atau administrator
                            melalui kanal internal perusahaan.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
