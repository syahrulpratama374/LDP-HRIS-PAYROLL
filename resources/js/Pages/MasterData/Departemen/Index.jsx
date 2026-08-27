import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Index({ auth, departemens }) {
    // State untuk mengatur buka/tutup Pop-up (Modal)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    // Inertia Form Hook untuk mengurus input data
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        kode_departemen: '',
        nama_departemen: '',
    });

    // Fungsi untuk membuka Modal (bisa untuk Tambah atau Edit)
    const openModal = (departemen = null) => {
        clearErrors();
        if (departemen) {
            setIsEditMode(true);
            setEditId(departemen.id);
            setData({
                kode_departemen: departemen.kode_departemen,
                nama_departemen: departemen.nama_departemen,
            });
        } else {
            setIsEditMode(false);
            setEditId(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        clearErrors();
    };

    // Fungsi untuk menyimpan data (Create / Update)
    const submit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('departemen.update', editId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('departemen.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    // Fungsi untuk menghapus data
    const handleDelete = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus departemen ini?')) {
            destroy(route('departemen.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Master Data - Departemen</h2>}
        >
            <Head title="Departemen" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        {/* Tombol Tambah Data */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-700">Daftar Departemen</h3>
                            <PrimaryButton onClick={() => openModal()}>+ Tambah Departemen</PrimaryButton>
                        </div>

                        {/* Tabel Data */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 border">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 border-r">No</th>
                                        <th className="px-6 py-3 border-r">Kode Departemen</th>
                                        <th className="px-6 py-3 border-r">Nama Departemen</th>
                                        <th className="px-6 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departemens.length > 0 ? (
                                        departemens.map((dept, index) => (
                                            <tr key={dept.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 border-r">{index + 1}</td>
                                                <td className="px-6 py-4 border-r font-medium text-gray-900">{dept.kode_departemen}</td>
                                                <td className="px-6 py-4 border-r">{dept.nama_departemen}</td>
                                                <td className="px-6 py-4 text-center space-x-2">
                                                    <SecondaryButton onClick={() => openModal(dept)} className="!py-1 !px-2">Edit</SecondaryButton>
                                                    <DangerButton onClick={() => handleDelete(dept.id)} className="!py-1 !px-2">Hapus</DangerButton>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Belum ada data departemen.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>

            {/* Modal Form Tambah/Edit */}
            <Modal show={isModalOpen} onClose={closeModal}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        {isEditMode ? 'Edit Departemen' : 'Tambah Departemen Baru'}
                    </h2>

                    <div className="mb-4">
                        <InputLabel htmlFor="kode_departemen" value="Kode Departemen (Maks 20 Karakter)" />
                        <TextInput
                            id="kode_departemen"
                            type="text"
                            name="kode_departemen"
                            value={data.kode_departemen}
                            className="mt-1 block w-full bg-gray-50"
                            isFocused={true}
                            onChange={(e) => setData('kode_departemen', e.target.value.toUpperCase())}
                            placeholder="Cth: IT, HRD, FIN"
                        />
                        <InputError message={errors.kode_departemen} className="mt-2" />
                    </div>

                    <div className="mb-6">
                        <InputLabel htmlFor="nama_departemen" value="Nama Departemen Lengkap" />
                        <TextInput
                            id="nama_departemen"
                            type="text"
                            name="nama_departemen"
                            value={data.nama_departemen}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('nama_departemen', e.target.value)}
                            placeholder="Cth: Information Technology"
                        />
                        <InputError message={errors.nama_departemen} className="mt-2" />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Data'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

        </AuthenticatedLayout>
    );
}