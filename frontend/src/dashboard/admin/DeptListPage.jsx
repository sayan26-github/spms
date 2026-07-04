import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useNavigate } from 'react-router-dom';
import departmentService from '../../services/departmentService';
import batchService from '../../services/batchService';
import { Plus, ChevronRight, ChevronLeft, Building } from 'lucide-react';

const DeptListPage = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, [batchId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [batchList, deptsData] = await Promise.all([
                batchService.getAll(),
                departmentService.getAll({ page_size: 1000 })
            ]);
            const batchesArr = Array.isArray(batchList) ? batchList : batchList?.results || [];
            const found = batchesArr.find(b => String(b.id) === String(batchId));
            setBatch(found || { name: `Batch ${batchId}`, id: batchId });
            
            const allDepts = Array.isArray(deptsData) ? deptsData : deptsData?.results || [];
            const validDepts = allDepts.filter(d => !d.batch || String(d.batch) === String(batchId));
            setDepartments(validDepts);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await departmentService.create({ ...formData, batch: batchId });
            setShowModal(false);
            setFormData({ name: '', code: '' });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create department');
        }
    };

    const modal = showModal ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-md rounded-2xl shadow-2xl animate-fade-in relative flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text">Create Department in {batch?.name}</h2>
                    <button onClick={() => setShowModal(false)} className="text-brand-muted hover:bg-slate-100 p-2 rounded-lg">
                        <Plus size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                    )}
                    <form id="dept-form" onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Department Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Computer Science"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full modern-input rounded-xl px-4 py-2 text-sm"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Department Code *</label>
                            <input
                                type="text"
                                placeholder="e.g. CSE"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full modern-input rounded-xl px-4 py-2 text-sm"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-brand-border flex justify-end space-x-3 mt-4">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-slate-200 rounded-xl">
                                Cancel
                            </button>
                            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-indigo-700 rounded-xl shadow-sm">
                                Create
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
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-brand-muted">
                <button onClick={() => navigate('/admin/students')} className="hover:text-brand-primary flex items-center gap-1 transition-colors">
                    <ChevronLeft size={16} /> All Batches
                </button>
                <span>/</span>
                <span className="text-brand-text font-medium">{batch?.name}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">{batch?.name} — Departments</h1>
                    <p className="text-sm text-brand-muted mt-1">Select a department to manage students</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
                >
                    <Plus size={18} className="mr-2" />
                    <span className="font-semibold text-sm">Create Department</span>
                </button>
            </div>

            {loading ? (
                <p className="text-brand-muted text-sm">Loading departments...</p>
            ) : departments.length === 0 ? (
                <div className="modern-card text-center py-12 rounded-2xl">
                    <Building size={48} className="mx-auto text-brand-muted/40 mb-4" />
                    <p className="text-brand-muted">No departments in this batch. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                        <Link
                            key={dept.id}
                            to={`/admin/students/batch/${batchId}/dept/${dept.id}`}
                            className="modern-card rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-brand-text group-hover:text-brand-primary transition-colors">
                                        {dept.name}
                                    </h3>
                                    <p className="text-sm text-brand-muted mt-1">Code: {dept.code}</p>
                                </div>
                                <ChevronRight size={20} className="text-brand-muted group-hover:text-brand-primary transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {modal}
        </div>
    );
};

export default DeptListPage;
