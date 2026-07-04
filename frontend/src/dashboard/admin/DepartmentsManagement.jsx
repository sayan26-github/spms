import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building, Plus, Hash } from 'lucide-react';
import departmentService from '../../services/departmentService';
import batchService from '../../services/batchService';

const DepartmentsManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', code: '', batch: '' });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [deptsData, batchesData] = await Promise.all([
                    departmentService.getAll({ page_size: 1000 }),
                    batchService.getAll({ page_size: 1000 })
                ]);
                setDepartments(Array.isArray(deptsData) ? deptsData : deptsData?.results || []);
                setBatches(Array.isArray(batchesData) ? batchesData : batchesData?.results || []);
            } catch (error) {
                console.error("Failed to fetch departments", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const fetchDepartments = async () => {
        try {
            const data = await departmentService.getAll({ page_size: 1000 });
            setDepartments(Array.isArray(data) ? data : data?.results || []);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSubmit = { ...formData };
            if (!dataToSubmit.batch) {
                delete dataToSubmit.batch; // Null batch allowed
            }
            await departmentService.create(dataToSubmit);
            setShowModal(false);
            setFormData({ name: '', code: '', batch: '' });
            fetchDepartments();
        } catch (error) {
            alert('Failed to create department: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data)));
        }
    };

    const getBatchName = (batchId) => {
        if (!batchId) return 'General';
        const batch = batches.find(b => String(b.id) === String(batchId));
        return batch ? batch.name : 'Unknown';
    };

    const modal = showModal ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-md rounded-2xl shadow-2xl animate-fade-in relative flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text">Add New Department</h2>
                    <button onClick={() => setShowModal(false)} className="text-brand-muted hover:bg-slate-100 p-2 rounded-lg">
                        <Plus size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-6">
                    <form id="dept-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Department Name *</label>
                            <input name="name" placeholder="e.g. Computer Science" onChange={handleInputChange} value={formData.name} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Department Code *</label>
                            <input name="code" placeholder="e.g. CSE" onChange={handleInputChange} value={formData.code} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Batch (Optional)</label>
                            <select name="batch" onChange={handleInputChange} value={formData.batch} className="w-full modern-input rounded-xl px-4 py-2 text-sm bg-transparent">
                                <option value="">General (Applies to all/none)</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
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
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">Department Management</h1>
                    <p className="text-sm text-brand-muted mt-1">View and manage college departments.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
                >
                    <Plus size={18} className="mr-2" />
                    <span className="font-semibold text-sm">Add Department</span>
                </button>
            </div>

            {/* Departments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loading ? (
                    <div className="col-span-full py-10 text-center text-brand-muted">Loading departments...</div>
                ) : departments.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-brand-muted">No departments found. Create one to get started.</div>
                ) : (
                    departments.map((dept) => (
                        <div key={dept.id} className="modern-card p-6 rounded-2xl flex flex-col items-start hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 border border-rose-200">
                                <Building size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-brand-text mb-1">{dept.name}</h3>
                            <div className="flex flex-col space-y-1 mt-2">
                                <div className="flex items-center text-sm text-brand-muted font-mono bg-slate-50 px-2 py-0.5 rounded w-max border border-slate-200">
                                    <Hash size={14} className="mr-1.5" /> Code: {dept.code}
                                </div>
                                <div className="flex items-center text-xs text-brand-muted mt-1">
                                    <span className="font-semibold mr-1">Batch:</span> {getBatchName(dept.batch)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {modal}
        </div>
    );
};

export default DepartmentsManagement;
