import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useBatches, useCreateBatch } from '../../hooks/useAdminQueries';
import { Plus, ChevronRight, Calendar } from 'lucide-react';

const StudentsManagement = () => {
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', year: '' });
    const [error, setError] = useState('');

    const { data: batches = [], isLoading: loading } = useBatches();
    const createBatchMutation = useCreateBatch();

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await createBatchMutation.mutateAsync(formData);
            setShowModal(false);
            setFormData({ name: '', year: '' });
        } catch (err) {
            setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create batch');
        }
    };

    const modal = showModal ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-md rounded-2xl shadow-2xl animate-fade-in relative flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text">Create New Batch</h2>
                    <button onClick={() => setShowModal(false)} className="text-brand-muted hover:bg-slate-100 p-2 rounded-lg">
                        <Plus size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                    )}
                    <form id="batch-form" onSubmit={handleCreateBatch} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Batch Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Batch 2024"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full modern-input rounded-xl px-4 py-2 text-sm"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Start Year *</label>
                            <input
                                type="number"
                                placeholder="e.g. 2024"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">Student Management</h1>
                    <p className="text-sm text-brand-muted mt-1">Select a batch to manage departments and students</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
                >
                    <Plus size={18} className="mr-2" />
                    <span className="font-semibold text-sm">Create Batch</span>
                </button>
            </div>

            {loading ? (
                <p className="text-brand-muted text-sm">Loading batches...</p>
            ) : batches.length === 0 ? (
                <div className="modern-card text-center py-12 rounded-2xl">
                    <Calendar size={48} className="mx-auto text-brand-muted/40 mb-4" />
                    <p className="text-brand-muted">No batches found. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batches.map((batch) => (
                        <Link
                            key={batch.id}
                            to={`/admin/students/batch/${batch.id}`}
                            className="modern-card rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-brand-text group-hover:text-brand-primary transition-colors">
                                        {batch.name}
                                    </h3>
                                    <p className="text-sm text-brand-muted mt-1">Year: {batch.year}</p>
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

export default StudentsManagement;
