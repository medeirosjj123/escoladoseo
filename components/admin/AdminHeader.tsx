import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminHeader: React.FC = () => {
    const location = useLocation();

    const navLinks = [
        { path: '/admin', label: 'Dashboard' },
        { path: '/admin/edit-main-page', label: 'Edit Main Page' },
        { path: '/admin/manage-users', label: 'Manage Users' },
        { path: '/admin/manage-courses', label: 'Manage Courses' },
        { path: '/admin/manage-apis', label: 'Manage APIs' },
    ];

    const linkClasses = "cursor-pointer transition hover:text-gray-300";
    const activeLinkClasses = "font-semibold text-white";
    const inactiveLinkClasses = "text-gray-300";

    return (
        <header className='fixed top-0 left-0 right-0 z-40 bg-[#141414]'>
            <div className="flex items-center justify-between px-4 md:px-16 py-4">
                <div className="flex items-center space-x-8">
                    <Link to="/admin">
                        <h1 className="text-red-600 text-3xl font-bold tracking-wider cursor-pointer">NETFLIX ADMIN</h1>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-4">
                        {navLinks.map(link => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`${linkClasses} ${location.pathname === link.path ? activeLinkClasses : inactiveLinkClasses}`}>
                                {link.label}
                            </Link>
                        ))}
                         <Link to="/" className={`${linkClasses} ${inactiveLinkClasses}`}>
                            Sair do Admin
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;