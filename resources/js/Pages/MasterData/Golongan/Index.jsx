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

export default function Index({ golongans }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        kode_golongan: '',
        nama_golongan: '',
        gaji_pokok: '',
    });

    // Fungsi format Rupiah bawaan JavaScript
    const formatRupiah = (angka) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    };

    const openModal = (golongan = null) => {
        clearErrors();
        if (golongan) {
            setIsEditMode(true);
            setEditId(golongan.id);
            setData({
                kode_golongan: golongan.kode_golongan,
                nama_golongan: golongan.nama_golongan,
                gaji_pokok: golongan.gaji_pokok,
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

    const submit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('golongan.update', editId), { onSuccess: () => closeModal() });
        } else {
            post(route('golongan.store'), { onSuccess: () => closeModal() });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus golongan ini?')) {
            destroy(route('golongan.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Master Data - Golongan</h2>}>
            <Head title="Golongan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-700">Daftar Golongan & Gaji Pokok</h3>
                            <PrimaryButton onClick={() => openModal()}>+ Tambah Golongan</PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 border">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 border-r">No</th>
                                        <th className="px-6 py-3 border-r">Kode Golongan</th>
                                        <th className="px-6 py-3 border-r">Nama Golongan</th>
                                        <th className="px-6 py-3 border-r text-right">Gaji Pokok</th>
                                        <th className="px-6 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {golongans.length > 0 ? (
                                        golongans.map((golongan, index) => (
                                            <tr key={golongan.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 border-r">{index + 1}</td>
                                                <td className="px-6 py-4 border-r font-medium text-gray-900">{golongan.kode_golongan}</td>
                                                <td className="px-6 py-4 border-r">{golongan.nama_golongan}</td>
                                                <td className="px-6 py-4 border-r font-semibold text-green-700 text-right">{formatRupiah(golongan.gaji_pokok)}</td>
                                                <td className="px-6 py-4 text-center space-x-2">
                                                    <SecondaryButton onClick={() => openModal(golongan)} className="!py-1 !px-2">Edit</SecondaryButton>
                                                    <DangerButton onClick={() => handleDelete(golongan.id)} className="!py-1 !px-2">Hapus</DangerButton>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">Belum ada data golongan.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={isModalOpen} onClose={closeModal}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        {isEditMode ? 'Edit Golongan' : 'Tambah Golongan Baru'}
                    </h2>
                    <div className="mb-4">
                        <InputLabel htmlFor="kode_golongan" value="Kode Golongan" />
                        <TextInput id="kode_golongan" value={data.kode_golongan} className="mt-1 block w-full bg-gray-50" isFocused={true} onChange={(e) => setData('kode_golongan', e.target.value.toUpperCase())} placeholder="Cth: GOL-1A" />
                        <InputError message={errors.kode_golongan} className="mt-2" />
                    </div>
                    <div className="mb-4">
                        <InputLabel htmlFor="nama_golongan" value="Nama Golongan" />
                        <TextInput id="nama_golongan" value={data.nama_golongan} className="mt-1 block w-full" onChange={(e) => setData('nama_golongan', e.target.value)} placeholder="Cth: Staff Senior" />
                        <InputError message={errors.nama_golongan} className="mt-2" />
                    </div>
                    <div className="mb-6">
                        <InputLabel htmlFor="gaji_pokok" value="Gaji Pokok (Rp)" />
                        <TextInput id="gaji_pokok" type="number" value={data.gaji_pokok} className="mt-1 block w-full" onChange={(e) => setData('gaji_pokok', e.target.value)} placeholder="Cth: 5000000 (Tanpa titik)" />
                        <InputError message={errors.gaji_pokok} className="mt-2" />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <SecondaryButton onClick={closeModal}>Batal</SecondaryButton>
                        <PrimaryButton disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan Data'}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}