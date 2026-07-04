import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminService } from '../../services/adminService';
import { Plus, Trash, BookOpen } from 'lucide-react';

const SubjectManagement = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        semester: 1
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const data = await adminService.getSubjects();
            setSubjects(Array.isArray(data) ? data : data?.results || []);
        } catch (error) {
            console.error("Failed to fetch subjects", error);
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
            await adminService.createSubject(formData);
            setShowModal(false);
            setFormData({ name: '', code: '', semester: 1 });
            fetchSubjects();
        } catch (error) {
            alert('Failed to create subject');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this subject?')) {
            try {
                await adminService.deleteSubject(id);
                fetchSubjects();
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    const modal = showModal ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-md rounded-2xl shadow-2xl animate-fade-in relative flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text">Add New Subject</h2>
                    <button onClick={() => setShowModal(false)} className="text-brand-muted hover:bg-slate-100 p-2 rounded-lg">
                        <Plus size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-6">
                    <form id="subject-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Subject Name *</label>
                            <input name="name" value={formData.name} onChange={handleInputChange} className="w-full modern-input rounded-xl px-4 py-2 text-sm" placeholder="e.g. Data Structures" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Subject Code *</label>
                            <input name="code" value={formData.code} onChange={handleInputChange} className="w-full modern-input rounded-xl px-4 py-2 text-sm" placeholder="e.g. CS201" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Semester *</label>
                            <input type="number" name="semester" value={formData.semester} onChange={handleInputChange} className="w-full modern-input rounded-xl px-4 py-2 text-sm" min="1" max="8" required />
                        </div>

                        <div className="pt-4 border-t border-brand-border flex justify-end space-x-3 mt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-slate-200 rounded-xl">
                                Cancel
                            </button>
                            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-indigo-700 rounded-xl shadow-sm">
                                Create Subject
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">Subject Management</h1>
                    <p className="text-sm text-brand-muted mt-1">View, create, and manage subjects for your institution.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
                >
                    <BookOpen size={18} className="mr-2" />
                    <span className="font-semibold text-sm">Add Subject</span>
                </button>
            </div>

            <div className="modern-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Subject Name</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Semester</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Teacher</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-brand-muted text-sm">Loading subjects...</td></tr>
                            ) : subjects.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-brand-muted text-sm">No subjects found.</td></tr>
                            ) : (
                                subjects.map((subject) => (
                                    <tr key={subject.id} className="group transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-brand-text">{subject.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 font-mono">
                                                {subject.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-brand-muted">{subject.semester}</td>
                                        <td className="px-6 py-4 text-sm text-brand-muted">{subject.teacher_name || 'Unassigned'}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleDelete(subject.id)} className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                                                <Trash size={16} />
                                            </button>
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

export default SubjectManagement;
