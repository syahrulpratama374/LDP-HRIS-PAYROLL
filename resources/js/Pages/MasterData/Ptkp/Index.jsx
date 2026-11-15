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

export default function Index({ ptkps }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        kode_ptkp: '',
        nominal_neto_tahunan: '',
        kategori_ter: 'A',
        deskripsi: '',
    });

    const formatRupiah = (angka) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    const openModal = (ptkp = null) => {
        clearErrors();
        if (ptkp) {
            setIsEditMode(true);
            setEditId(ptkp.id);
            setData({
                kode_ptkp: ptkp.kode_ptkp,
                nominal_neto_tahunan: ptkp.nominal_neto_tahunan,
                kategori_ter: ptkp.kategori_ter || 'A',
                deskripsi: ptkp.deskripsi || '',
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
            put(route('ptkp.update', editId), { onSuccess: () => closeModal() });
        } else {
            post(route('ptkp.store'), { onSuccess: () => closeModal() });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Yakin ingin menghapus PTKP ini?')) {
            destroy(route('ptkp.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Master Data - PTKP</h2>}>
            <Head title="Master PTKP" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-700">Daftar PTKP & Kategori TER</h3>
                            <PrimaryButton onClick={() => openModal()}>+ Tambah PTKP</PrimaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 border">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 border-r">No</th>
                                        <th className="px-6 py-3 border-r">Kode PTKP</th>
                                        <th className="px-6 py-3 border-r">Deskripsi</th>
                                        <th className="px-6 py-3 border-r text-right">Nominal Neto / Tahun</th>
                                        <th className="px-6 py-3 border-r text-center">Kategori TER</th>
                                        <th className="px-6 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ptkps.length > 0 ? (
                                        ptkps.map((ptkp, index) => (
                                            <tr key={ptkp.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 border-r">{index + 1}</td>
                                                <td className="px-6 py-4 border-r font-medium text-gray-900">{ptkp.kode_ptkp}</td>
                                                <td className="px-6 py-4 border-r">{ptkp.deskripsi}</td>
                                                <td className="px-6 py-4 border-r font-semibold text-green-700 text-right">{formatRupiah(ptkp.nominal_neto_tahunan)}</td>
                                                <td className="px-6 py-4 border-r text-center font-bold">{ptkp.kategori_ter}</td>
                                                <td className="px-6 py-4 text-center space-x-2">
                                                    <SecondaryButton onClick={() => openModal(ptkp)} className="!py-1 !px-2">Edit</SecondaryButton>
                                                    <DangerButton onClick={() => handleDelete(ptkp.id)} className="!py-1 !px-2">Hapus</DangerButton>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">Belum ada data PTKP.</td>
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
                    <h2 className="text-lg font-medium text-gray-900 mb-4">{isEditMode ? 'Edit PTKP' : 'Tambah PTKP Baru'}</h2>
                    <div className="mb-4">
                        <InputLabel htmlFor="kode_ptkp" value="Kode PTKP" />
                        <TextInput id="kode_ptkp" value={data.kode_ptkp} className="mt-1 block w-full bg-gray-50" isFocused={true} onChange={(e) => setData('kode_ptkp', e.target.value.toUpperCase())} placeholder="Cth: TK/0" />
                        <InputError message={errors.kode_ptkp} className="mt-2" />
                    </div>
                    <div className="mb-4">
                        <InputLabel htmlFor="deskripsi" value="Deskripsi" />
                        <TextInput id="deskripsi" value={data.deskripsi} className="mt-1 block w-full" onChange={(e) => setData('deskripsi', e.target.value)} placeholder="Cth: Tidak Kawin, Tanpa Tanggungan" />
                        <InputError message={errors.deskripsi} className="mt-2" />
                    </div>
                    <div className="mb-4">
                        <InputLabel htmlFor="nominal_neto_tahunan" value="Nominal Neto Tahunan (Rp)" />
                        <TextInput id="nominal_neto_tahunan" type="number" value={data.nominal_neto_tahunan} className="mt-1 block w-full" onChange={(e) => setData('nominal_neto_tahunan', e.target.value)} placeholder="Cth: 54000000 (Tanpa titik)" />
                        <InputError message={errors.nominal_neto_tahunan} className="mt-2" />
                    </div>
                    <div className="mb-6">
                        <InputLabel htmlFor="kategori_ter" value="Kategori TER" />
                        <select id="kategori_ter" value={data.kategori_ter} onChange={(e) => setData('kategori_ter', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                        </select>
                        <InputError message={errors.kategori_ter} className="mt-2" />
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
