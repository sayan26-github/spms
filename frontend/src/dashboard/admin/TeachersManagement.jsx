import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminService } from '../../services/adminService';
import { Search, UserPlus, Mail, Plus } from 'lucide-react';

const TeachersManagement = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        registration_number: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'TEACHER',
        department: '',
        designation: ''
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const data = await adminService.getUsers({ page_size: 1000 });
            const teacherList = (Array.isArray(data) ? data : data?.results || []).filter(u => u.role === 'TEACHER');
            setTeachers(teacherList);
        } catch (error) {
            console.error("Failed to fetch teachers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await adminService.createUser(formData);
            setShowModal(false);
            setFormData({ registration_number: '', first_name: '', last_name: '', email: '', password: '', role: 'TEACHER', department: '', designation: '' });
            fetchTeachers();
        } catch (error) {
            alert('Failed to create teacher: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data)));
        }
    };

    const filtered = teachers.filter(t =>
        t.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const modal = showModal ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-md rounded-2xl shadow-2xl animate-fade-in relative flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text">Add New Teacher</h2>
                    <button onClick={() => setShowModal(false)} className="text-brand-muted hover:bg-slate-100 p-2 rounded-lg">
                        <Plus size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    <form id="teacher-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Registration Number *</label>
                            <input name="registration_number" placeholder="e.g. T002" onChange={handleInputChange} value={formData.registration_number} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-brand-text">First Name *</label>
                                <input name="first_name" placeholder="First Name" onChange={handleInputChange} value={formData.first_name} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-brand-text">Last Name *</label>
                                <input name="last_name" placeholder="Last Name" onChange={handleInputChange} value={formData.last_name} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Email *</label>
                            <input name="email" type="email" placeholder="teacher@institute.edu" onChange={handleInputChange} value={formData.email} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Password *</label>
                            <input name="password" type="password" placeholder="Secure password" onChange={handleInputChange} value={formData.password} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Department</label>
                            <input name="department" placeholder="e.g. Computer Science" onChange={handleInputChange} value={formData.department} className="w-full modern-input rounded-xl px-4 py-2 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Designation</label>
                            <input name="designation" placeholder="e.g. Professor" onChange={handleInputChange} value={formData.designation} className="w-full modern-input rounded-xl px-4 py-2 text-sm" />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-brand-border bg-slate-50 flex justify-end space-x-3 rounded-b-2xl">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-slate-200 rounded-xl">
                        Cancel
                    </button>
                    <button type="submit" form="teacher-form" className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-indigo-700 rounded-xl shadow-sm">
                        Create
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">Teacher Management</h1>
                    <p className="text-sm text-brand-muted mt-1">View and add teachers to your institution.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
                >
                    <UserPlus size={18} className="mr-2" />
                    <span className="font-semibold text-sm">Add Teacher</span>
                </button>
            </div>

            {/* Search */}
            <div className="modern-card p-4 rounded-xl flex items-center gap-3">
                <Search size={20} className="text-brand-muted shrink-0" />
                <input
                    type="text"
                    placeholder="Search teachers by name or registration number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm text-brand-text placeholder-brand-muted"
                />
            </div>

            {/* Teachers Table */}
            <div className="modern-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Teacher</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Registration ID</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Contact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {loading ? (
                                <tr><td colSpan="3" className="px-6 py-8 text-center text-brand-muted text-sm">Loading teachers...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="3" className="px-6 py-8 text-center text-brand-muted text-sm">No teachers found.</td></tr>
                            ) : (
                                filtered.map((teacher) => (
                                    <tr key={teacher.id} className="group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold mr-4 border border-blue-200">
                                                    {teacher.first_name?.[0]}{teacher.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-brand-text">{teacher.first_name} {teacher.last_name}</p>
                                                    <p className="text-[11px] text-brand-muted">{teacher.college_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 font-mono">
                                                {teacher.registration_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-xs text-brand-muted">
                                                <Mail size={12} className="mr-1.5" /> {teacher.email || 'N/A'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal}
        </div>
    );
};

export default TeachersManagement;
