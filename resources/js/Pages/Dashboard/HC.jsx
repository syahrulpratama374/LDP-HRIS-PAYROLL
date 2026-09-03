import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function KaryawanDashboard({ auth }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Dasbor Karyawan" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 font-bold text-gray-900">
                        Ini adalah cangkang kosong untuk Dasbor Karyawan.
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}