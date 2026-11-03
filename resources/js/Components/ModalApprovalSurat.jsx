import React, { useState, useRef } from "react";
import { useForm, router } from "@inertiajs/react";
import SignatureCanvas from "react-signature-canvas";

import {
    PenTool,
    QrCode,
    CheckCircle,
    X,
    RotateCcw,
    AlertCircle,
} from "lucide-react";

export default function ModalApprovalSurat({ show, onClose, suratId }) {
    const [activeTab, setActiveTab] = useState("canvas"); // 'canvas' atau 'qr_code'
    const sigCanvas = useRef({});

    const { data, setData, processing, reset } = useForm({
        jenis_ttd: "canvas",
        ttd_base64: "",
        catatan: "",
    });

    if (!show) return null;

    // Reset Form saat Modal Ditutup
    const handleClose = () => {
        reset();
        if (sigCanvas.current?.clear) sigCanvas.current.clear();
        onClose();
    };

    // Bersihkan Coretan TTD Canvas
    const handleClearCanvas = () => {
        if (sigCanvas.current?.clear) sigCanvas.current.clear();
        setData("ttd_base64", "");
    };

    // Submit Persetujuan (Menggunakan router.post agar payload terkirim presisi ke Laravel)
    const handleSubmit = (e) => {
        e.preventDefault();

        let finalTtdBase64 = "";

        if (activeTab === "canvas") {
            if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
                alert(
                    "Silakan goreskan tanda tangan Anda pada kanvas terlebih dahulu.",
                );
                return;
            }
            finalTtdBase64 = sigCanvas.current
                .getTrimmedCanvas()
                .toDataURL("image/png");
        }

        router.post(
            route("keluar.approve", suratId),
            {
                jenis_ttd: activeTab,
                ttd_base64: finalTtdBase64,
                catatan: data.catatan,
            },
            {
                onSuccess: () => {
                    handleClose();
                },
                onError: (err) => {
                    console.error("Gagal menyetujui surat:", err);
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 transition-all">
                {/* HEADER MODAL */}
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold text-base">
                            Persetujuan & Penandatanganan Surat
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* TABS SWITCHER */}
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("canvas");
                                setData("jenis_ttd", "canvas");
                            }}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
                                activeTab === "canvas"
                                    ? "bg-white text-indigo-600 shadow-sm font-bold"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <PenTool className="w-4 h-4" />
                            Gores TTD Basah
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("qr_code");
                                setData("jenis_ttd", "qr_code");
                            }}
                            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
                                activeTab === "qr_code"
                                    ? "bg-white text-indigo-600 shadow-sm font-bold"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <QrCode className="w-4 h-4" />
                            Quick QR Approval
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* TAB 1: CANVAS TTD BASAH */}
                        {activeTab === "canvas" && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">
                                        Goreskan Tanda Tangan Anda di Atas
                                        Kotak:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleClearCanvas}
                                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset Canvas
                                    </button>
                                </div>

                                <div className="border-2 border-dashed border-indigo-200 rounded-xl bg-slate-50 overflow-hidden relative">
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        penColor="#0f172a"
                                        canvasProps={{
                                            className:
                                                "w-full h-44 cursor-crosshair",
                                        }}
                                    />
                                    <span className="absolute bottom-2 right-3 text-[10px] text-slate-400 select-none pointer-events-none">
                                        Digital Signature Pad
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: QUICK QR APPROVAL */}
                        {activeTab === "qr_code" && (
                            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-center space-y-2">
                                <QrCode className="w-10 h-10 text-indigo-600 mx-auto" />
                                <h4 className="font-bold text-sm text-indigo-950">
                                    Persetujuan Digital Resmi via QR Code
                                </h4>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                    Sistem akan menerbitkan QR Code otentikasi
                                    unik yang langsung tercetak di berkas resmi
                                    PDF dokumen ini.
                                </p>
                            </div>
                        )}

                        {/* INPUT CATATAN / KETERANGAN */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Catatan Persetujuan (Opsional)
                            </label>
                            <textarea
                                rows="2"
                                value={data.catatan}
                                onChange={(e) =>
                                    setData("catatan", e.target.value)
                                }
                                placeholder="Tambahkan instruksi / catatan persetujuan jika ada..."
                                className="w-full text-xs rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                            ></textarea>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
                            >
                                {processing
                                    ? "Memproses..."
                                    : "Setujui & Tandatangani"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
