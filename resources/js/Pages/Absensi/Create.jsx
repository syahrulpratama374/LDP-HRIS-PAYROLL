import React, { useState, useEffect, useRef, useCallback } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Webcam from "react-webcam";
import PrimaryButton from "@/Components/PrimaryButton";

export default function Create({ auth, absensiHariIni, karyawan }) {
    const webcamRef = useRef(null);

    // State untuk Waktu (Jam Digital) & Lokasi
    const [waktu, setWaktu] = useState(new Date());
    const [koordinat, setKoordinat] = useState("");
    const [statusLokasi, setStatusLokasi] = useState(
        "Mencari koordinat GPS...",
    );
    const [isLocationReady, setIsLocationReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Efek Jam Digital Real-time
    useEffect(() => {
        const timer = setInterval(() => setWaktu(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Efek Pelacak Lokasi (Geotagging)
    useEffect(() => {
        if (!navigator.geolocation) {
            setStatusLokasi("Peramban (Browser) Anda tidak mendukung GPS.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                setKoordinat(`${lat}, ${lon}`);
                setStatusLokasi("Koordinat GPS Terkunci ✅");
                setIsLocationReady(true);
            },
            (error) => {
                setStatusLokasi(
                    "Akses Lokasi Ditolak! Harap izinkan akses lokasi di browser.",
                );
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    }, []);

    // 3. Fungsi Menjepret Foto & Kirim ke Backend
    const handleAbsen = useCallback(
        (tipe) => {
            if (!isLocationReady) {
                alert("Tunggu hingga koordinat lokasi Anda terkunci!");
                return;
            }

            setIsSubmitting(true);

            // Jepret foto dari komponen Webcam (Format Base64)
            const imageSrc = webcamRef.current.getScreenshot();

            // Gunakan Inertia Router untuk menembak API Backend
            router.post(
                route("absensi.store"),
                {
                    image: imageSrc,
                    koordinat: koordinat,
                    tipe: tipe, // 'masuk' atau 'keluar'
                },
                {
                    preserveState: true,
                    onFinish: () => setIsSubmitting(false),
                    onError: (errors) => {
                        if (errors.error) alert(errors.error);
                    },
                },
            );
        },
        [webcamRef, koordinat, isLocationReady],
    );

    // Menentukan Status Absensi Karyawan Hari Ini
    const sudahMasuk = absensiHariIni !== null;
    const sudahKeluar =
        absensiHariIni?.waktu_keluar !== null &&
        absensiHariIni?.waktu_keluar !== undefined;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Terminal Absensi Kehadiran
                </h2>
            }
        >
            <Head title="Absensi Kehadiran" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-8 flex flex-col items-center">
                        {/* Header Profil Singkat */}
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">
                                Halo, {karyawan?.nama_lengkap || auth.user.name}
                            </h3>
                            <p className="text-gray-500">
                                {karyawan?.jabatan?.nama_jabatan || "Staff"}
                            </p>
                        </div>

                        {/* Jam Digital */}
                        <div className="bg-indigo-900 text-white px-8 py-4 rounded-xl mb-6 shadow-lg text-center w-full max-w-md">
                            <p className="text-sm font-medium opacity-80 uppercase tracking-wider">
                                {waktu.toLocaleDateString("id-ID", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                            <p className="text-5xl font-mono font-bold mt-1 tracking-widest">
                                {waktu.toLocaleTimeString("id-ID", {
                                    hour12: false,
                                })}
                            </p>
                        </div>

                        {/* Indikator Lokasi GPS */}
                        <div
                            className={`text-sm mb-4 px-4 py-2 rounded-full font-semibold ${isLocationReady ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                        >
                            📍 {statusLokasi}{" "}
                            {isLocationReady && `(${koordinat})`}
                        </div>

                        {/* Area Kamera (Hanya tampil jika belum absen keluar) */}
                        {!sudahKeluar ? (
                            <div className="relative border-4 border-gray-200 rounded-lg overflow-hidden shadow-inner mb-6 bg-black">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "user" }}
                                    className="w-full max-w-md h-auto mirrored"
                                />
                                <div className="absolute top-2 right-2 flex space-x-2">
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-md bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center mb-6">
                                <div className="text-5xl mb-4">🎉</div>
                                <h4 className="text-xl font-bold text-green-700">
                                    Absensi Selesai!
                                </h4>
                                <p className="text-gray-600 mt-2">
                                    Anda sudah menyelesaikan absen masuk dan
                                    pulang untuk hari ini. Terima kasih atas
                                    kerja keras Anda!
                                </p>
                            </div>
                        )}

                        {/* Area Tombol Aksi */}
                        <div className="flex w-full max-w-md justify-center mt-2">
                            {!sudahMasuk && (
                                <button
                                    onClick={() => handleAbsen("masuk")}
                                    disabled={!isLocationReady || isSubmitting}
                                    className={`w-full py-4 rounded-xl text-white font-bold text-lg tracking-wider uppercase transition-all shadow-lg ${!isLocationReady ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
                                >
                                    {isSubmitting
                                        ? "Memproses..."
                                        : "📸 CLOCK IN (MASUK)"}
                                </button>
                            )}

                            {sudahMasuk && !sudahKeluar && (
                                <button
                                    onClick={() => handleAbsen("keluar")}
                                    disabled={!isLocationReady || isSubmitting}
                                    className={`w-full py-4 rounded-xl text-white font-bold text-lg tracking-wider uppercase transition-all shadow-lg ${!isLocationReady ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 active:scale-95"}`}
                                >
                                    {isSubmitting
                                        ? "Memproses..."
                                        : "📸 CLOCK OUT (PULANG)"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
