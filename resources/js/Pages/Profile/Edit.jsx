import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';

// --- IMPORT REACT IMAGE CROP & CSS NYA ---
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Fungsi pembantu untuk menghasilkan file hasil crop dari canvas HTML5
function getCroppedImg(image, crop) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Kita set hasil akhir crop berukuran kotak tetap (misal: 400x400 pixel) agar optimal
    canvas.width = 400;
    canvas.height = 400;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Canvas is empty');
                return;
            }
            // Ubah blob menjadi objek File agar bisa dibaca oleh FormData Laravel
            const croppedFile = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' });
            resolve(croppedFile);
        }, 'image/jpeg', 0.9);
    });
}

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export default function Edit({ status, user, karyawan }) {
    // --- STATE FORM INFO KONTAK (TIER 1) ---
    const formInfo = useForm({
        no_telp: karyawan?.no_telp || '',
        alamat_domisili: karyawan?.alamat_domisili || '',
        nama_kontak_darurat: karyawan?.nama_kontak_darurat || '',
        no_telp_darurat: karyawan?.no_telp_darurat || '',
    });

    const submitInfo = (e) => {
        e.preventDefault();
        formInfo.patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    // --- STATE & LOGIC UNTUK CROP FOTO PROFIL ---
    const formFoto = useForm({ foto_profil: null });
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const imgRef = useRef(null);

    const onSelectFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset crop
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
            setShowCropModal(true); // Munculkan modal crop
        }
    };

    const onImageLoad = (e) => {
        const { width, height } = e.currentTarget;
        // Kunci aspek rasio 1:1 (kotak ala WhatsApp)
        setCrop(centerAspectCrop(width, height, 1));
    };

    const handleConfirmCrop = async () => {
        if (imgRef.current && completedCrop?.width && completedCrop?.height) {
            try {
                const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
                
                // Masukkan file hasil crop ke form Inertia lalu kirim
                formFoto.setData('foto_profil', croppedFile);
                formFoto.post(route('profile.foto.update'), {
                    preserveScroll: true,
                    onSuccess: () => {
                        formFoto.reset();
                        setShowCropModal(false);
                        setImgSrc('');
                    },
                });
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profil Saya (ESS)
                </h2>
            }
        >
            <Head title="Profil Saya" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    
                    {/* BAGIAN 1: INFO KARYAWAN & FOTO PROFIL */}
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8 flex flex-col md:flex-row gap-8 items-start border-l-4 border-indigo-500">
                        <div className="flex flex-col items-center w-full md:w-1/4">
                            {karyawan?.foto_profil ? (
                                <img
                                    src={karyawan.foto_profil}
                                    alt="Foto Profil"
                                    className="h-32 w-32 rounded-full object-cover border-4 border-gray-100 shadow-md mb-4"
                                />
                            ) : (
                                <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-500 mb-4 uppercase shadow-inner">
                                    {user.name.charAt(0)}
                                </div>
                            )}

                            {/* Tombol Pilih File Foto */}
                            <input
                                type="file"
                                id="upload-foto-ess"
                                className="hidden"
                                accept="image/png, image/jpeg, image/jpg"
                                onChange={onSelectFile}
                            />
                            <label
                                htmlFor="upload-foto-ess"
                                className="cursor-pointer text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200 hover:bg-indigo-100 transition"
                            >
                                {formFoto.processing ? "Menyimpan..." : "📷 Ubah Foto"}
                            </label>
                            <InputError message={formFoto.errors.foto_profil} className="mt-2 text-center" />
                        </div>

                        {/* Data Utama Read-Only */}
                        <div className="w-full md:w-3/4 space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Informasi Pekerjaan (Read-Only)</h3>
                                <p className="text-xs text-gray-500 mt-1">Data di bawah ini tidak dapat diubah sendiri demi keamanan sistem.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500">Nama Lengkap Sesuai KTP</span>
                                    <span className="font-bold text-gray-900">{karyawan?.nama_lengkap || user.name}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">NIK Internal</span>
                                    <span className="font-bold text-gray-900">{karyawan?.nik_internal || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Departemen</span>
                                    <span className="font-medium text-gray-900">{karyawan?.departemen?.nama_departemen || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Jabatan</span>
                                    <span className="font-medium text-gray-900">{karyawan?.jabatan?.nama_jabatan || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Email Kantor (Login)</span>
                                    <span className="font-medium text-gray-900">{user.email}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500">Atasan Langsung</span>
                                    <span className="font-medium text-blue-600">{karyawan?.atasan?.nama_lengkap || 'BOD'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BAGIAN 2: FORM UPDATE DATA KONTAK (TIER 1) */}
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <section className="max-w-xl">
                            <header>
                                <h2 className="text-lg font-medium text-gray-900">Ubah Data Kontak & Darurat</h2>
                                <p className="mt-1 text-sm text-gray-600">
                                    Pastikan nomor telepon dan alamat domisili Anda selalu mutakhir.
                                </p>
                            </header>

                            <form onSubmit={submitInfo} className="mt-6 space-y-6">
                                <div>
                                    <InputLabel htmlFor="no_telp" value="Nomor Telepon / WhatsApp" />
                                    <TextInput
                                        id="no_telp"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={formInfo.data.no_telp}
                                        onChange={(e) => formInfo.setData('no_telp', e.target.value)}
                                    />
                                    <InputError className="mt-2" message={formInfo.errors.no_telp} />
                                </div>

                                <div>
                                    <InputLabel htmlFor="alamat_domisili" value="Alamat Domisili Saat Ini" />
                                    <textarea
                                        id="alamat_domisili"
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm"
                                        rows="3"
                                        value={formInfo.data.alamat_domisili}
                                        onChange={(e) => formInfo.setData('alamat_domisili', e.target.value)}
                                    />
                                    <InputError className="mt-2" message={formInfo.errors.alamat_domisili} />
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">Kontak Darurat</h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <InputLabel htmlFor="nama_kontak_darurat" value="Nama Kontak Darurat" />
                                            <TextInput
                                                id="nama_kontak_darurat"
                                                type="text"
                                                className="mt-1 block w-full"
                                                value={formInfo.data.nama_kontak_darurat}
                                                onChange={(e) => formInfo.setData('nama_kontak_darurat', e.target.value)}
                                                required
                                            />
                                            <InputError className="mt-2" message={formInfo.errors.nama_kontak_darurat} />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="no_telp_darurat" value="No. Telepon Darurat" />
                                            <TextInput
                                                id="no_telp_darurat"
                                                type="text"
                                                className="mt-1 block w-full"
                                                value={formInfo.data.no_telp_darurat}
                                                onChange={(e) => formInfo.setData('no_telp_darurat', e.target.value)}
                                                required
                                            />
                                            <InputError className="mt-2" message={formInfo.errors.no_telp_darurat} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={formInfo.processing}>Simpan Data Kontak</PrimaryButton>

                                    {status === 'success' && (
                                        <p className="text-sm text-green-600 font-bold">Data berhasil disimpan.</p>
                                    )}
                                </div>
                            </form>
                        </section>
                    </div>

                    {/* BAGIAN 3: FORM UPDATE PASSWORD */}
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                </div>
            </div>

            {/* --- MODAL POPUP CROP FOTO ALA WHATSAPP --- */}
            {showCropModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-2xl flex flex-col items-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Sesuaikan Foto Profil</h3>
                        <p className="text-xs text-gray-500 mb-4 text-center">Geser dan atur area kotak untuk memfokuskan foto profil Anda.</p>
                        
                        <div className="max-h-[60vh] overflow-auto flex justify-center w-full bg-gray-50 p-2 rounded border">
                            {imgSrc && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1} // Memaksa kotak 1:1
                                    circularCrop={false}
                                >
                                    <img
                                        ref={imgRef}
                                        alt="Crop me"
                                        src={imgSrc}
                                        onLoad={onImageLoad}
                                        style={{ maxHeight: '50vh' }}
                                    />
                                </ReactCrop>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 w-full">
                            <SecondaryButton 
                                onClick={() => {
                                    setShowCropModal(false);
                                    setImgSrc('');
                                }}
                            >
                                Batal
                            </SecondaryButton>
                            <PrimaryButton 
                                onClick={handleConfirmCrop}
                                disabled={formFoto.processing}
                            >
                                {formFoto.processing ? 'Menyimpan...' : 'Potong & Simpan Foto'}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}