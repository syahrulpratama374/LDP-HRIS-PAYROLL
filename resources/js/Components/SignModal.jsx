import React, { useRef, useState } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import SignatureCanvas from "react-signature-canvas";

export default function SignModal({ isOpen, onClose, suratId }) {
    const sigCanvas = useRef({});
    const [jenisTtd, setJenisTtd] = useState("Digital_Canvas"); // Default ke Canvas

    const { data, setData, post, processing, reset, clearErrors } = useForm({
        jenis_ttd: "Digital_Canvas",
        signature_base64: "",
    });

    // Handle ganti tab jenis TTD
    const handleTabChange = (type) => {
        setJenisTtd(type);
        setData("jenis_ttd", type);
        clearErrors();
    };

    // Bersihkan coretan canvas
    const clearSignature = () => {
        sigCanvas.current.clear();
        setData("signature_base64", "");
    };

    // Proses Submit (Approve)
    const handleApprove = (e) => {
        e.preventDefault();

        // Jika pilih Canvas tapi masih kosong, tolak
        if (jenisTtd === "Digital_Canvas") {
            if (sigCanvas.current.isEmpty()) {
                alert("Tanda tangan tidak boleh kosong!");
                return;
            }
            // Ambil data gambar base64 dari canvas
            data.signature_base64 = sigCanvas.current
                .getTrimmedCanvas()
                .toDataURL("image/png");
        }

        post(route("keluar.terbitkan", suratId), {
            onSuccess: () => {
                closeModal();
            },
        });
    };

    const closeModal = () => {
        reset();
        if (
            sigCanvas.current &&
            typeof sigCanvas.current.clear === "function"
        ) {
            sigCanvas.current.clear();
        }
        onClose();
    };

    return (
        <Modal show={isOpen} onClose={closeModal} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                    Persetujuan Dokumen
                </h2>

                {/* Tab Pemilihan */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                    <button
                        type="button"
                        onClick={() => handleTabChange("Digital_Canvas")}
                        className={`flex-1 py-2 text-sm font-bold rounded-md ${
                            jenisTtd === "Digital_Canvas"
                                ? "bg-white shadow text-indigo-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        ✍️ Gambar TTD
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange("Qr_Code_Quick")}
                        className={`flex-1 py-2 text-sm font-bold rounded-md ${
                            jenisTtd === "Qr_Code_Quick"
                                ? "bg-white shadow text-indigo-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        ⚡ Quick QR Approve
                    </button>
                </div>

                {/* Area Konten Tab */}
                <form onSubmit={handleApprove}>
                    {jenisTtd === "Digital_Canvas" ? (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-500 text-center">
                                Goreskan tanda tangan Anda di dalam kotak di
                                bawah ini.
                            </p>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 relative">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor="black"
                                    canvasProps={{
                                        className:
                                            "w-full h-48 cursor-crosshair rounded-lg",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={clearSignature}
                                    className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded shadow-sm hover:bg-red-200 font-bold"
                                >
                                    Hapus (Ulang)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 flex flex-col items-center justify-center space-y-3 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="text-4xl">📱</div>
                            <p className="text-sm text-blue-800 text-center px-4">
                                Dokumen ini akan disahkan menggunakan{" "}
                                <strong>Enkripsi QR Code Validasi</strong>.
                                Tidak diperlukan coretan tanda tangan manual.
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton
                            onClick={closeModal}
                            disabled={processing}
                        >
                            Batal
                        </SecondaryButton>
                        <PrimaryButton
                            className="!bg-indigo-600"
                            disabled={processing}
                        >
                            {processing
                                ? "Memproses..."
                                : "Approve & Terbitkan Sah"}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
