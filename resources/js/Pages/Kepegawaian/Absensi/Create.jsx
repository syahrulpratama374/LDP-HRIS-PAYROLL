import React, { useState, useEffect, useRef, useCallback } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Webcam from "react-webcam";

export default function Create({ auth, absensiHariIni, karyawan }) {
    const webcamRef = useRef(null);

    const [waktu, setWaktu] = useState(new Date());
    const [koordinat, setKoordinat] = useState("");
    const [statusLokasi, setStatusLokasi] = useState(
        "Mencari koordinat GPS...",
    );
    const [isLocationReady, setIsLocationReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State BARU: Mengontrol kapan kamera absen pulang dimunculkan
    const [bukaKameraPulang, setBukaKameraPulang] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setWaktu(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

    const handleAbsen = useCallback(
        (tipe) => {
            if (!isLocationReady) {
                alert("Tunggu hingga koordinat lokasi Anda terkunci!");
                return;
            }

            setIsSubmitting(true);
            const imageSrc = webcamRef.current.getScreenshot();

            router.post(
                route("absensi.store"),
                {
                    image: imageSrc,
                    koordinat: koordinat,
                    tipe: tipe,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsSubmitting(false);
                        setBukaKameraPulang(false); // Tutup kamera setelah berhasil absen pulang
                    },
                    onError: (errors) => {
                        setIsSubmitting(false);
                        if (errors.error) alert(errors.error);
                    },
                },
            );
        },
        [webcamRef, koordinat, isLocationReady],
    );

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
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800">
                                Halo, {karyawan?.nama_lengkap || auth.user.name}
                            </h3>
                            <p className="text-gray-500">
                                {karyawan?.jabatan?.nama_jabatan || "Staff"}
                            </p>
                        </div>

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

                        <div
                            className={`text-sm mb-4 px-4 py-2 rounded-full font-semibold ${isLocationReady ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                        >
                            📍 {statusLokasi}{" "}
                            {isLocationReady && `(${koordinat})`}
                        </div>

                        {/* LOGIKA ANTARMUKA YANG BARU */}

                        {/* KONDISI 1: Belum Absen Masuk Sama Sekali */}
                        {!sudahMasuk && (
                            <>
                                <div className="relative border-4 border-gray-200 rounded-lg overflow-hidden shadow-inner mb-6 bg-black">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={0.6} // Kompresi Kualitas Gambar (Keamanan Server)
                                        videoConstraints={{
                                            width: 640,
                                            height: 480,
                                            facingMode: "user",
                                        }} // Turunkan Resolusi
                                        className="w-full max-w-md h-auto mirrored"
                                    />
                                </div>
                                <button
                                    onClick={() => handleAbsen("masuk")}
                                    disabled={!isLocationReady || isSubmitting}
                                    className={`w-full max-w-md py-4 rounded-xl text-white font-bold text-lg tracking-wider uppercase transition-all shadow-lg ${!isLocationReady ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
                                >
                                    {isSubmitting
                                        ? "Merekam Kehadiran..."
                                        : "📸 CLOCK IN (MASUK)"}
                                </button>
                            </>
                        )}

                        {/* KONDISI 2: Sudah Masuk, Tapi Belum Pulang */}
                        {sudahMasuk && !sudahKeluar && !bukaKameraPulang && (
                            <div className="w-full max-w-md bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center mb-6">
                                <div className="text-4xl mb-3">✅</div>
                                <h4 className="text-lg font-bold text-blue-800">
                                    Absen Masuk Berhasil!
                                </h4>
                                <p className="text-gray-600 mt-1 mb-4">
                                    Anda tercatat masuk pada pukul{" "}
                                    <strong>
                                        {new Date(
                                            absensiHariIni.waktu_masuk,
                                        ).toLocaleTimeString("id-ID")}
                                    </strong>
                                    .
                                </p>

                                <button
                                    onClick={() => setBukaKameraPulang(true)}
                                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition-all"
                                >
                                    Siap Untuk Pulang? Buka Kamera
                                </button>
                            </div>
                        )}

                        {/* KONDISI 3: Membuka Kamera Untuk Pulang */}
                        {sudahMasuk && !sudahKeluar && bukaKameraPulang && (
                            <>
                                <div className="relative border-4 border-orange-200 rounded-lg overflow-hidden shadow-inner mb-6 bg-black">
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
                                        className="w-full max-w-md h-auto mirrored"
                                    />
                                </div>
                                <div className="flex w-full max-w-md space-x-2">
                                    <button
                                        onClick={() =>
                                            setBukaKameraPulang(false)
                                        }
                                        className="w-1/3 py-4 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={() => handleAbsen("keluar")}
                                        disabled={
                                            !isLocationReady || isSubmitting
                                        }
                                        className={`w-2/3 py-4 rounded-xl text-white font-bold text-lg tracking-wider uppercase transition-all shadow-lg ${!isLocationReady ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 active:scale-95"}`}
                                    >
                                        {isSubmitting
                                            ? "Memproses..."
                                            : "📸 CLOCK OUT"}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* KONDISI 4: Sudah Selesai Absen Masuk & Pulang */}
                        {sudahKeluar && (
                            <div className="w-full max-w-md bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center mb-6">
                                <div className="text-5xl mb-4">🎉</div>
                                <h4 className="text-xl font-bold text-green-700">
                                    Tugas Hari Ini Selesai!
                                </h4>
                                <p className="text-gray-600 mt-2">
                                    Anda sudah melakukan absen masuk dan absen
                                    pulang. Selamat beristirahat!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
