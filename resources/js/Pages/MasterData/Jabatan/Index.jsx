import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function Index({ jabatans }) {
    const { auth } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        kode_jabatan: '',
        nama_jabatan: '',
    });

    const openModal = (jabatan = null) => {
        clearErrors();
        if (jabatan) {
            setIsEditMode(true);
            setEditId(jabatan.id);
            setData({
                kode_jabatan: jabatan.kode_jabatan,
                nama_jabatan: jabatan.nama_jabatan,
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
            put(route('jabatan.update', editId), { onSuccess: () => closeModal() });
        } else {
            post(route('jabatan.store'), { onSuccess: () => closeModal() });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus jabatan ini?')) {
            destroy(route('jabatan.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Master Data - Jabatan</h2>}>
            <Head title="Jabatan" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-700">Daftar Jabatan</h3>
                            <PrimaryButton onClick={() => openModal()}>+ Tambah Jabatan</PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 border">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 border-r">No</th>
                                        <th className="px-6 py-3 border-r">Kode Jabatan</th>
                                        <th className="px-6 py-3 border-r">Nama Jabatan</th>
                                        <th className="px-6 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jabatans.length > 0 ? (
                                        jabatans.map((jabatan, index) => (
                                            <tr key={jabatan.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 border-r">{index + 1}</td>
                                                <td className="px-6 py-4 border-r font-medium text-gray-900">{jabatan.kode_jabatan}</td>
                                                <td className="px-6 py-4 border-r">{jabatan.nama_jabatan}</td>
                                                <td className="px-6 py-4 text-center space-x-2">
                                                    <SecondaryButton onClick={() => openModal(jabatan)} className="!py-1 !px-2">Edit</SecondaryButton>
                                                    <DangerButton onClick={() => handleDelete(jabatan.id)} className="!py-1 !px-2">Hapus</DangerButton>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Belum ada data jabatan.</td>
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
                        {isEditMode ? 'Edit Jabatan' : 'Tambah Jabatan Baru'}
                    </h2>
                    <div className="mb-4">
                        <InputLabel htmlFor="kode_jabatan" value="Kode Jabatan" />
                        <TextInput id="kode_jabatan" value={data.kode_jabatan} className="mt-1 block w-full bg-gray-50" isFocused={true} onChange={(e) => setData('kode_jabatan', e.target.value.toUpperCase())} placeholder="Cth: MGR, STF, SPV" />
                        <InputError message={errors.kode_jabatan} className="mt-2" />
                    </div>
                    <div className="mb-6">
                        <InputLabel htmlFor="nama_jabatan" value="Nama Jabatan" />
                        <TextInput id="nama_jabatan" value={data.nama_jabatan} className="mt-1 block w-full" onChange={(e) => setData('nama_jabatan', e.target.value)} placeholder="Cth: Manager HRD" />
                        <InputError message={errors.nama_jabatan} className="mt-2" />
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