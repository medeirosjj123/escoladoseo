import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';

const AdminLayout: React.FC = () => {
    return (
        <div className="bg-[#141414] min-h-screen text-white">
            <AdminHeader />
            <main className="pt-24 px-4 md:px-16">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;