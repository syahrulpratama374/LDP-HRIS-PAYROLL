import React, { useState, useEffect, useRef, useCallback } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import Webcam from "react-webcam";
import imageCompression from "browser-image-compression";

export default function Create({
    auth,
    absensiHariIni,
    karyawan,
    shifts = [],
    isNoc = false,
    scheduledShiftId = null,
    bukaAbsenMenit = 60,
}) {
    const webcamRef = useRef(null);

    // =========================================================
    // STATE (TIDAK DIUBAH)
    // =========================================================
    const [waktu, setWaktu] = useState(new Date());
    const [koordinat, setKoordinat] = useState("");
    const [statusLokasi, setStatusLokasi] = useState("Menghubungkan ke GPS...");
    const [isLocationReady, setIsLocationReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bukaKameraPulang, setBukaKameraPulang] = useState(false);
    const [catatanLogbook, setCatatanLogbook] = useState("");
    const [selectedShift, setSelectedShift] = useState("");

    useEffect(() => {
        if (scheduledShiftId) setSelectedShift(scheduledShiftId);
    }, [scheduledShiftId]);

    useEffect(() => {
        const timer = setInterval(() => setWaktu(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const shiftDetail = shifts.find((s) => String(s.id) === String(selectedShift));
    let isShiftBelumBuka = false;
    let jamBukaAbsenStr = "";
    let jamMasukShiftStr = "";

    if (isNoc && shiftDetail) {
        jamMasukShiftStr = shiftDetail.jam_masuk;
        const [h, m] = jamMasukShiftStr.split(":").map(Number);
        const shiftTime = new Date(waktu);
        shiftTime.setHours(h, m, 0, 0);
        const openTime = new Date(shiftTime.getTime() - bukaAbsenMenit * 60000);
        jamBukaAbsenStr = openTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
        if (waktu < openTime) isShiftBelumBuka = true;
    }

    useEffect(() => {
        if (!navigator.geolocation) {
            setStatusLokasi("Browser tidak mendukung GPS.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setKoordinat(`${position.coords.latitude}, ${position.coords.longitude}`);
                setStatusLokasi("Lokasi berhasil terdeteksi");
                setIsLocationReady(true);
            },
            () => {
                setStatusLokasi("Lokasi belum diizinkan. Aktifkan GPS browser.");
                setIsLocationReady(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    const sudahMasuk = absensiHariIni?.waktu_masuk !== null && absensiHariIni?.waktu_masuk !== undefined;
    const sudahKeluar = absensiHariIni?.waktu_keluar !== null && absensiHariIni?.waktu_keluar !== undefined;
    const statusAbsensi = absensiHariIni?.status || null;
    const statusNonKehadiran = ["Cuti", "Izin", "Alpha"].includes(statusAbsensi);

    const formatTanggal = (date) => date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const formatJam = (value) => {
        if (!value) return "-";
        try {
            let date = new Date(value);
            if (Number.isNaN(date.getTime()) && typeof value === "string") date = new Date(value.replace(" ", "T"));
            if (!Number.isNaN(date.getTime())) return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
            const match = String(value).match(/(\d{2}):(\d{2})/);
            if (match) return `${match[1]}:${match[2]}`;
            return "-";
        } catch { return "-"; }
    };
    const jamStr = waktu.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

    const handleAbsen = useCallback(async (tipe) => {
        if (!isLocationReady) { alert("Lokasi belum terdeteksi. Silakan tunggu GPS."); return; }
        if (isNoc && !selectedShift) { alert("Tim Operasional/NOC wajib memilih Jam Shift sebelum melakukan absensi!"); return; }
        if (isNoc && tipe === "masuk" && isShiftBelumBuka) { alert(`Absensi belum dibuka. Shift Anda dimulai pukul ${jamMasukShiftStr} (Absen dibuka pukul ${jamBukaAbsenStr} WIB).`); return; }
        if (!webcamRef.current) { alert("Kamera belum siap."); return; }
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) { alert("Foto belum berhasil diambil. Silakan coba lagi."); return; }
        setIsSubmitting(true);
        try {
            const imageFile = await imageCompression.getFilefromDataUrl(imageSrc, "absen.jpg");
            const compressedFile = await imageCompression(imageFile, { maxSizeMB: 0.1, maxWidthOrHeight: 800, useWebWorker: true });
            const compressedImageSrc = await imageCompression.getDataUrlFromFile(compressedFile);
            router.post(route("absensi.store"), {
                image: compressedImageSrc, koordinat, tipe, catatan_logbook: catatanLogbook, shift_id: selectedShift,
            }, {
                preserveScroll: true,
                onSuccess: () => { setIsSubmitting(false); setBukaKameraPulang(false); setCatatanLogbook(""); setSelectedShift(""); },
                onError: (errors) => { setIsSubmitting(false); if (errors.error) alert(errors.error); },
            });
        } catch (error) {
            console.error("Gagal melakukan kompresi foto:", error);
            alert("Terjadi kesalahan saat memproses foto absensi.");
            setIsSubmitting(false);
        }
    }, [koordinat, isLocationReady, catatanLogbook, selectedShift, isNoc, isShiftBelumBuka, jamMasukShiftStr, jamBukaAbsenStr]);

    const getStatusBadge = () => {
        if (statusAbsensi === "Cuti") return { label: "Cuti", className: "bg-purple-50 text-purple-700 border-purple-200" };
        if (statusAbsensi === "Izin") return { label: "Izin", className: "bg-amber-50 text-amber-700 border-amber-200" };
        if (statusAbsensi === "Alpha") return { label: "Alpha", className: "bg-red-50 text-red-700 border-red-200" };
        if (statusAbsensi === "Dinas Luar") return { label: "Dinas Luar", className: "bg-blue-50 text-blue-700 border-blue-200" };
        if (statusAbsensi === "Terlambat") return { label: "Terlambat", className: "bg-orange-50 text-orange-700 border-orange-200" };
        if (statusAbsensi === "Hadir") return { label: "Hadir", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
        return { label: "Belum Absen", className: "bg-gray-50 text-gray-600 border-gray-200" };
    };
    const badge = getStatusBadge();

    const ClockIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /><path strokeLinecap="round" strokeWidth={2} d="M12 7v5l3 2" /></svg>;
    const CameraIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" strokeWidth={2} /></svg>;
    const LocationIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s7-5.4 7-11a7 7 0 10-14 0c0 5.6 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" strokeWidth={2} /></svg>;
    const DashboardIcon = ({ className = "w-5 h-5" }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 13h6V4H4v9zm10 7h6v-9h-6v9zM4 20h6v-3H4v3zm10-11h6V4h-6v5z" /></svg>;

    return (
        <AuthenticatedLayout header="Absensi Kehadiran">
            <Head title="Absensi Kehadiran" />

            <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
                
                {/* ======================================================= */}
                {/* KONDISI 1: JIKA SEDANG CUTI / IZIN / ALPHA               */}
                {/* ======================================================= */}
                {statusNonKehadiran ? (
                    <div className="flex min-h-[70vh] flex-col items-center justify-center">
                        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                            {/* Garis Aksen Atas */}
                            <div className="h-2 w-full bg-gradient-to-r from-[#2A164E] to-[#431D6D]"></div>
                            
                            <div className="p-8 sm:p-10 text-center">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#2A164E]/5 text-[#2A164E]">
                                    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                
                                <h2 className="mt-6 text-2xl font-bold text-[#2A164E]">
                                    Status: {statusAbsensi}
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                    Anda tidak perlu melakukan Clock In atau Clock Out untuk hari ini. Selamat beristirahat atau semoga urusan Anda lancar.
                                </p>
                                
                                <div className="mt-8">
                                    <Link 
                                        href={route("dashboard")} 
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2A164E] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#431D6D]"
                                    >
                                        <DashboardIcon className="h-4 w-4" /> 
                                        Kembali ke Dashboard
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    
                    /* ======================================================= */
                    /* KONDISI 2: TAMPILAN NORMAL (CLOCK IN / OUT)             */
                    /* ======================================================= */
                    <div>
                        {/* Teks Deskripsi Pindah Ke Sini, agar hilang saat user Cuti */}
                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-500">
                                Silakan lakukan verifikasi wajah dan pastikan lokasi Anda aktif untuk mencatat kehadiran.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                            
                            {/* KIRI: KAMERA (8/12 bagian) */}
                            <div className="lg:col-span-8 space-y-5">
                                {!sudahKeluar && (
                                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        
                                        <div className="border-b border-gray-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h2 className="text-lg font-bold text-[#2A164E]">{sudahMasuk ? "Waktunya Clock Out" : "Silakan Clock In"}</h2>
                                            </div>
                                            <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 ${isLocationReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${isLocationReady ? "bg-emerald-500" : "animate-pulse bg-amber-500"}`} />
                                                <span className="text-[10px] font-bold uppercase">{isLocationReady ? "GPS Aktif" : "Menunggu GPS"}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-6">
                                            
                                            {/* Webcam */}
                                            {(!sudahMasuk || (sudahMasuk && !sudahKeluar && bukaKameraPulang)) && (
                                                <div className="relative mx-auto aspect-video max-h-[420px] w-full max-w-3xl overflow-hidden rounded-xl bg-[#1a1a2e] border border-gray-800">
                                                    <Webcam
                                                        audio={false}
                                                        ref={webcamRef}
                                                        screenshotFormat="image/jpeg"
                                                        screenshotQuality={0.6}
                                                        videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                        <div className="h-[70%] w-[35%] rounded-[3rem] border-2 border-dashed border-[#F3B817]/80" />
                                                    </div>
                                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                                                        <span className="rounded bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">Posisikan wajah di tengah</span>
                                                    </div>
                                                </div>
                                            )}

                                            {sudahMasuk && !sudahKeluar && !bukaKameraPulang && (
                                                <div className="mx-auto flex aspect-video max-h-[420px] w-full max-w-3xl flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-6 text-center">
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-[#2A164E]">
                                                        <ClockIcon className="h-8 w-8" />
                                                    </div>
                                                    <h3 className="mt-4 text-lg font-bold text-[#2A164E]">Anda Sedang Bekerja</h3>
                                                    <p className="mt-1 max-w-sm text-sm text-gray-500">Clock In sudah tercatat. Klik tombol di bawah saat Anda siap untuk pulang.</p>
                                                </div>
                                            )}

                                            <div className="mt-5 space-y-4 max-w-3xl mx-auto">
                                                
                                                {isNoc && (!sudahMasuk || (sudahMasuk && !sudahKeluar && bukaKameraPulang)) && (
                                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#2A164E]">
                                                            Pilih Shift Kerja <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            value={selectedShift}
                                                            onChange={(e) => setSelectedShift(e.target.value)}
                                                            disabled={Boolean(scheduledShiftId)}
                                                            className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-700 outline-none focus:border-[#2A164E] focus:ring-1 focus:ring-[#2A164E] disabled:bg-gray-100"
                                                        >
                                                            <option value="" disabled>-- Pilih Shift --</option>
                                                            {shifts.map((shift) => (
                                                                <option key={shift.id} value={shift.id}>
                                                                    {shift.nama_shift} ({shift.jam_masuk} - {shift.jam_keluar})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {!sudahMasuk && isNoc && selectedShift && isShiftBelumBuka && (
                                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                                        <div className="flex items-start gap-3">
                                                            <ClockIcon className="h-5 w-5 shrink-0 text-amber-600" />
                                                            <div>
                                                                <h4 className="text-sm font-bold text-amber-900">Absensi Belum Dibuka</h4>
                                                                <p className="mt-1 text-xs text-amber-700">Buka pada pukul <span className="font-bold underline">{jamBukaAbsenStr} WIB</span>.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                    {!sudahMasuk && (
                                                        <button
                                                            onClick={() => handleAbsen("masuk")}
                                                            disabled={!isLocationReady || isSubmitting || (isNoc && !selectedShift) || (isNoc && isShiftBelumBuka)}
                                                            className={`flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all ${
                                                                !isLocationReady || isSubmitting || (isNoc && !selectedShift) || (isNoc && isShiftBelumBuka)
                                                                    ? "cursor-not-allowed bg-gray-200 text-gray-400"
                                                                    : "bg-[#F3B817] text-[#2A164E] hover:bg-[#e0a80e]"
                                                            }`}
                                                        >
                                                            <CameraIcon className="h-5 w-5" />
                                                            {isSubmitting ? "Memproses..." : "Clock In Sekarang"}
                                                        </button>
                                                    )}

                                                    {sudahMasuk && !sudahKeluar && !bukaKameraPulang && (
                                                        <button
                                                            onClick={() => setBukaKameraPulang(true)}
                                                            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#2A164E] text-sm font-bold text-white transition hover:bg-[#431D6D]"
                                                        >
                                                            <CameraIcon className="h-5 w-5" /> Buka Kamera Clock Out
                                                        </button>
                                                    )}
                                                </div>

                                                {sudahMasuk && !sudahKeluar && bukaKameraPulang && (
                                                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                                                        <label className="mb-2 block text-sm font-bold text-[#2A164E]">Catatan Logbook (Wajib NOC)</label>
                                                        <textarea
                                                            rows="3"
                                                            value={catatanLogbook}
                                                            onChange={(e) => setCatatanLogbook(e.target.value)}
                                                            className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-[#2A164E]"
                                                            placeholder="Ringkasan pekerjaan hari ini..."
                                                        />
                                                        <div className="mt-3 flex gap-2">
                                                            <button onClick={() => setBukaKameraPulang(false)} className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Batal</button>
                                                            <button onClick={() => handleAbsen("keluar")} className="flex-[2] rounded-lg bg-[#2A164E] py-2 text-sm font-bold text-white hover:bg-[#431D6D]">Selesai & Clock Out</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {sudahKeluar && (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-500 shadow-sm">
                                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <h3 className="mt-4 text-xl font-bold text-emerald-900">Absensi Selesai!</h3>
                                        <p className="mt-2 text-sm text-emerald-700">Kehadiran hari ini telah tercatat lengkap.</p>
                                        <Link href={route("dashboard")} className="mt-6 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#2A164E] px-6 text-sm font-bold text-white transition hover:bg-[#431D6D]">
                                            <DashboardIcon className="h-4 w-4" /> Kembali ke Dashboard
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* KANAN: INFO & WAKTU (4/12 bagian) */}
                            <div className="lg:col-span-4 space-y-4">
                                
                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Waktu Saat Ini</p>
                                    <p className="mt-1 text-3xl font-black tabular-nums text-[#2A164E]">{jamStr}</p>
                                    <p className="mt-1 text-xs font-medium text-gray-500">{formatTanggal(waktu)}</p>
                                </div>

                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                                        <p className="text-sm font-bold text-[#2A164E]">Status Hari Ini</p>
                                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${badge.className}`}>{badge.label}</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Clock In</span>
                                            <span className="font-bold text-[#2A164E] tabular-nums">{sudahMasuk ? formatJam(absensiHariIni?.waktu_masuk) : "--:--"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Clock Out</span>
                                            <span className="font-bold text-[#2A164E] tabular-nums">{sudahKeluar ? formatJam(absensiHariIni?.waktu_keluar) : "--:--"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <LocationIcon className="h-4 w-4 text-[#431D6D]" />
                                        <span className="text-sm font-bold text-[#2A164E]">Lokasi Anda</span>
                                        <span className={`ml-auto text-[10px] font-bold ${isLocationReady ? "text-emerald-600" : "text-amber-600"}`}>
                                            {isLocationReady ? "Aktif" : "Menunggu"}
                                        </span>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-2.5 border border-gray-100">
                                        <p className="text-xs text-gray-600">{statusLokasi}</p>
                                        {isLocationReady && <p className="mt-1 font-mono text-[10px] text-gray-400 break-all">{koordinat}</p>}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}