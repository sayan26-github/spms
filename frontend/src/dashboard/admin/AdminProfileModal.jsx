import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User as UserIcon, Mail, Phone } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../auth/AuthContext';

const AdminProfileModal = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: ''
    });

    // Additional read-only fields for display
    const [readOnlyData, setReadOnlyData] = useState({
        registration_number: '',
        role_display: '',
        college_name: ''
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setFetching(true);
        try {
            const response = await authService.getProfile();
            const data = response.data;
            setFormData({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
                phone_number: data.phone_number || ''
            });
            setReadOnlyData({
                registration_number: data.registration_number,
                role_display: data.role_display,
                college_name: data.college_name
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load profile data.');
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await authService.updateProfile(formData);
            setSuccess('Profile updated successfully!');
            // Update context so the sidebar instantly reflects the change
            updateUser({
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                name: `${response.data.first_name} ${response.data.last_name}`.trim()
            });

            // Close after brief delay 
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to update profile. Please check the inputs.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-lg rounded-2xl shadow-2xl animate-fade-in relative max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-brand-border">
                    <h2 className="text-xl font-bold text-brand-text flex items-center">
                        <UserIcon className="mr-2 text-brand-primary" size={24} />
                        Edit Profile
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-brand-muted hover:bg-slate-100 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {fetching ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                        </div>
                    ) : (
                        <form id="profile-form" onSubmit={handleSubmit} className="space-y-5">

                            {/* Status Messages */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    {success}
                                </div>
                            )}

                            {/* Read Only Info Panel */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-brand-border mb-6">
                                <p className="text-xs uppercase tracking-wider text-brand-muted font-bold mb-3">Account Info</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-brand-muted">Role</p>
                                        <p className="font-medium text-brand-text text-sm">{readOnlyData.role_display}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-brand-muted">Registration ID</p>
                                        <p className="font-medium text-brand-text text-sm">{readOnlyData.registration_number}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-brand-muted">Institution</p>
                                        <p className="font-medium text-brand-text text-sm truncate">{readOnlyData.college_name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-brand-text">First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="w-full modern-input rounded-xl px-4 py-2.5"
                                        placeholder="First Name"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-brand-text">Last Name</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full modern-input rounded-xl px-4 py-2.5"
                                        placeholder="Last Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-brand-text">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-brand-muted" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full modern-input rounded-xl pl-10 pr-4 py-2.5"
                                        placeholder="admin@college.edu"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-brand-text">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 text-brand-muted" size={18} />
                                    <input
                                        type="text"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className="w-full modern-input rounded-xl pl-10 pr-4 py-2.5"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-brand-border flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-slate-200 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || fetching}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-indigo-700 rounded-xl shadow-sm transition flex items-center disabled:opacity-70"
                                >
                                    {loading ? 'Saving...' : (
                                        <>
                                            <Save size={16} className="mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

            </div>
        </div>,
        document.body
    );
};

export default AdminProfileModal;
