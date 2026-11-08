import React, { useRef, useState, useEffect } from "react";
import { useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

export default function SignModal({ isOpen, onClose, suratId }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [jenisTtd, setJenisTtd] = useState("canvas"); // canvas, qr_code, upload_gambar

    const { data, setData, reset, clearErrors } = useForm({
        jenis_ttd: "canvas",
        ttd_base64: "",
        ttd_file: null, // Tambahan state untuk file upload
        catatan: "",
    });

    const [processing, setProcessing] = useState(false);

    // Inisialisasi Kertas Canvas Native saat Modal Dibuka
    useEffect(() => {
        if (isOpen && jenisTtd === "canvas" && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }
    }, [isOpen, jenisTtd]);

    // Handler Goresan TTD (Mouse & Touch)
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    // Bersihkan Coretan Canvas
    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setHasSignature(false);
        setData("ttd_base64", "");
    };

    // Handle perpindahan tab jenis TTD
    const handleTabChange = (type) => {
        setJenisTtd(type);
        setData("jenis_ttd", type);
        clearErrors();
    };

    // Reset dan tutup modal
    const closeModal = () => {
        reset();
        clearSignature();
        setProcessing(false);
        onClose();
    };

    // Proses Submit (Approve)
    const handleApprove = (e) => {
        e.preventDefault();

        let base64Data = "";
        let payload = {
            jenis_ttd: jenisTtd,
            catatan: data.catatan,
        };

        // Validasi jika memilih Canvas
        if (jenisTtd === "canvas") {
            if (canvasRef.current) {
                base64Data = canvasRef.current.toDataURL("image/png");
            }
            if (!hasSignature || !base64Data) {
                alert(
                    "Silakan goreskan tanda tangan Anda pada kanvas terlebih dahulu.",
                );
                return;
            }
            payload.ttd_base64 = base64Data;
        }

        // Validasi jika memilih Upload Gambar
        if (jenisTtd === "upload_gambar") {
            if (!data.ttd_file) {
                alert("Silakan pilih file gambar tanda tangan (PNG/JPG).");
                return;
            }
            payload.ttd_file = data.ttd_file;
        }

        setProcessing(true);

        // Mengirim data menggunakan router Inertia
        // Inertia otomatis mengubah ini menjadi FormData (multipart/form-data) jika ada file
        router.post(route("keluar.approve", suratId), payload, {
            onSuccess: () => {
                closeModal();
            },
            onError: (errors) => {
                setProcessing(false);
                console.error("Approval error:", errors);
            },
            onFinish: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <Modal show={isOpen} onClose={closeModal} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                    Persetujuan & Penandatanganan Dokumen
                </h2>

                {/* TAB PEMILIHAN METODE APPROVAL */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                    <button
                        type="button"
                        onClick={() => handleTabChange("canvas")}
                        className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
                            jenisTtd === "canvas"
                                ? "bg-white shadow text-indigo-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        ✍️ Draw
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange("upload_gambar")}
                        className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
                            jenisTtd === "upload_gambar"
                                ? "bg-white shadow text-indigo-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        🖼️ Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange("qr_code")}
                        className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${
                            jenisTtd === "qr_code"
                                ? "bg-white shadow text-indigo-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        ⚡ QR
                    </button>
                </div>

                <form onSubmit={handleApprove} className="space-y-4">
                    {/* TAB 1: CANVAS TTD BASAH NATIVE */}
                    {jenisTtd === "canvas" && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 text-center">
                                Goreskan tanda tangan Anda di dalam kotak di
                                bawah ini:
                            </p>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 relative overflow-hidden">
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={180}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    className="w-full h-44 cursor-crosshair rounded-lg touch-none bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={clearSignature}
                                    className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded shadow-sm hover:bg-red-200 font-bold transition-colors"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: UPLOAD FILE GAMBAR */}
                    {jenisTtd === "upload_gambar" && (
                        <div className="py-6 flex flex-col items-center justify-center space-y-3 bg-gray-50 border border-gray-200 rounded-lg px-4">
                            <div className="text-3xl">🖼️</div>
                            <p className="text-xs text-gray-600 text-center font-medium">
                                Unggah file scan tanda tangan Anda (Latar
                                belakang transparan disarankan).
                            </p>
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg"
                                onChange={(e) =>
                                    setData("ttd_file", e.target.files[0])
                                }
                                className="block w-full text-xs text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>
                    )}

                    {/* TAB 3: QUICK QR APPROVAL */}
                    {jenisTtd === "qr_code" && (
                        <div className="py-6 flex flex-col items-center justify-center space-y-2 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                            <div className="text-4xl">📱</div>
                            <p className="text-xs text-indigo-900 text-center px-4 font-medium">
                                Dokumen ini akan disahkan menggunakan{" "}
                                <strong>Enkripsi QR Code Validasi Resmi</strong>
                                . Tidak diperlukan coretan tanda tangan manual.
                            </p>
                        </div>
                    )}

                    {/* CATATAN APPROVAL (OPSIONAL) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Catatan / Keterangan (Opsional)
                        </label>
                        <textarea
                            rows="2"
                            value={data.catatan}
                            onChange={(e) => setData("catatan", e.target.value)}
                            placeholder="Tambahkan instruksi / catatan persetujuan jika ada..."
                            className="w-full text-xs rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        ></textarea>
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="mt-6 flex justify-end gap-3 pt-2 border-t">
                        <SecondaryButton
                            type="button"
                            onClick={closeModal}
                            disabled={processing}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            className="!bg-indigo-600 hover:!bg-indigo-700"
                            disabled={processing}
                        >
                            {processing ? "Memproses..." : "Approve & Sahkan"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
