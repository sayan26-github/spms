import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layers, Plus, Calendar } from 'lucide-react';
import batchService from '../../services/batchService';

const BatchesManagement = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', year: '' });

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            const data = await batchService.getAll({ page_size: 1000 });
            setBatches(Array.isArray(data) ? data : data?.results || []);
        } catch (error) {
            console.error("Failed to fetch batches", error);
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
            await batchService.create(formData);
            setShowModal(false);
            setFormData({ name: '', year: '' });
            fetchBatches();
        } catch (error) {
            alert('Failed to create batch: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data)));
        }
    };

    const modal = showModal ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-md rounded-2xl shadow-2xl animate-fade-in relative flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text">Add New Batch</h2>
                    <button onClick={() => setShowModal(false)} className="text-brand-muted hover:bg-slate-100 p-2 rounded-lg">
                        <Plus size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-6">
                    <form id="batch-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Batch Name *</label>
                            <input name="name" placeholder="e.g. Batch 2026" onChange={handleInputChange} value={formData.name} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Start Year *</label>
                            <input name="year" type="number" placeholder="e.g. 2022" onChange={handleInputChange} value={formData.year} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-brand-border bg-slate-50 flex justify-end space-x-3 rounded-b-2xl">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-slate-200 rounded-xl">
                        Cancel
                    </button>
                    <button type="submit" form="batch-form" className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-indigo-700 rounded-xl shadow-sm">
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
                    <h1 className="text-2xl font-bold text-brand-text">Batch Management</h1>
                    <p className="text-sm text-brand-muted mt-1">View and manage admission batches.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
                >
                    <Plus size={18} className="mr-2" />
                    <span className="font-semibold text-sm">Add Batch</span>
                </button>
            </div>

            {/* Batches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loading ? (
                    <div className="col-span-full py-10 text-center text-brand-muted">Loading batches...</div>
                ) : batches.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-brand-muted">No batches found. Create one to get started.</div>
                ) : (
                    batches.map((batch) => (
                        <div key={batch.id} className="modern-card p-6 rounded-2xl flex flex-col items-start hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                                <Layers size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-brand-text mb-1">{batch.name}</h3>
                            <div className="flex items-center text-sm text-brand-muted">
                                <Calendar size={14} className="mr-1.5" /> Start Year: {batch.year}
                            </div>
                        </div>
                    ))
                )}
            </div>
            {modal}
        </div>
    );
};

export default BatchesManagement;
