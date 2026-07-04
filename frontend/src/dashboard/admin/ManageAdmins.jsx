import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminService } from '../../services/adminService';
import { Plus, Search, Shield, ShieldCheck, Mail, Phone } from 'lucide-react';

const ManageAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        designation: 'Admin',
        email: '',
        phone_number: '',
        registration_number: '',
        password: '' // Required for creation
    });
    const [createError, setCreateError] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAdmins();
            setAdmins(Array.isArray(data) ? data : data?.results || []);
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setCreateLoading(true);
        setCreateError('');
        try {
            await adminService.createAdmin(formData);
            setIsCreateModalOpen(false);
            setFormData({
                first_name: '', last_name: '', designation: 'Admin',
                email: '', phone_number: '', registration_number: '', password: ''
            });
            fetchAdmins(); // Refresh list
        } catch (error) {
            console.error('Failed to create admin:', error);
            setCreateError(error.response?.data?.detail || 'Failed to create admin. Check inputs and ensure registration number is unique.');
        } finally {
            setCreateLoading(false);
        }
    };

    const filteredAdmins = (admins || []).filter(admin =>
        admin.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text flex items-center">
                        <ShieldCheck className="mr-3 text-brand-primary" size={28} />
                        Manage Administrators
                    </h1>
                    <p className="text-sm text-brand-muted mt-1">View and provision new admin accounts across the institution.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
                >
                    <Plus size={18} className="mr-2" />
                    <span className="font-semibold text-sm">Provision Admin</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="modern-card p-4 rounded-xl flex items-center gap-3">
                <Search size={20} className="text-brand-muted shrink-0" />
                <input
                    type="text"
                    placeholder="Search admins by name, ID, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm text-brand-text placeholder-brand-muted"
                />
            </div>

            {/* Admins Data Table */}
            <div className="modern-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Account</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Registration ID</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Role</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-brand-muted text-sm">Loading administrators...</td>
                                </tr>
                            ) : filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-brand-muted text-sm">No administrators found.</td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <tr key={admin.id} className="group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-brand-primaryLight text-brand-primary flex items-center justify-center font-bold mr-4">
                                                    {admin.first_name?.[0]}{admin.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-brand-text">{admin.first_name} {admin.last_name}</p>
                                                    <p className="text-[11px] text-brand-muted">{admin.college_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 font-mono">
                                                {admin.registration_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 space-y-1">
                                            <div className="flex items-center text-xs text-brand-muted">
                                                <Mail size={12} className="mr-1.5" /> {admin.email || 'N/A'}
                                            </div>
                                            {admin.phone_number && (
                                                <div className="flex items-center text-xs text-brand-muted">
                                                    <Phone size={12} className="mr-1.5" /> {admin.phone_number}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-brand-primary">
                                                <Shield size={12} className="mr-1.5" />
                                                {admin.role_display}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Admin Modal */}
            {isCreateModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="modern-card w-full max-w-md rounded-2xl shadow-2xl animate-fade-in relative flex flex-col">
                        <div className="p-6 border-b border-brand-border flex justify-between items-center">
                            <h2 className="text-xl font-bold text-brand-text">Provision New Admin</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-brand-muted hover:bg-slate-100 p-2 rounded-lg">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {createError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {createError}
                                </div>
                            )}

                            <form id="create-admin-form" onSubmit={handleCreateAdmin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-brand-text">Registration ID *</label>
                                    <input
                                        required type="text"
                                        value={formData.registration_number}
                                        onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                                        className="w-full modern-input rounded-xl px-4 py-2 text-sm" placeholder="e.g., ADM-001"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-brand-text">First Name *</label>
                                        <input
                                            required type="text"
                                            value={formData.first_name}
                                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full modern-input rounded-xl px-4 py-2 text-sm" placeholder="First Name"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-brand-text">Last Name *</label>
                                        <input
                                            required type="text"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full modern-input rounded-xl px-4 py-2 text-sm" placeholder="Last Name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-brand-text">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full modern-input rounded-xl px-4 py-2 text-sm" placeholder="admin@institute.edu"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-brand-text">Account Password *</label>
                                    <input
                                        required type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full modern-input rounded-xl px-4 py-2 text-sm" placeholder="Secure password"
                                    />
                                    <p className="text-[11px] text-brand-muted mt-1">They can change this password upon first login.</p>
                                </div>

                                <div className="pt-4 border-t border-brand-border flex justify-end space-x-3 mt-4">
                                    <button
                                        type="button" onClick={() => setIsCreateModalOpen(false)}
                                        className="px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-slate-200 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit" disabled={createLoading}
                                        className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-70 flex items-center"
                                    >
                                        {createLoading ? 'Provisioning...' : 'Provision Admin'}
                                    </button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ManageAdmins;
