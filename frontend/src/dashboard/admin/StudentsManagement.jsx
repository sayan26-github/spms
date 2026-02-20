import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import batchService from '../../services/batchService';
import { Plus, ChevronRight, Calendar } from 'lucide-react';

const StudentsManagement = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', year: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const data = await batchService.getAll();
            setBatches(data.results || data);
        } catch (err) {
            console.error('Failed to fetch batches', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await batchService.create(formData);
            setShowModal(false);
            setFormData({ name: '', year: '' });
            fetchBatches();
        } catch (err) {
            setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create batch');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Select a batch to manage departments and students</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} /> Create Batch
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading batches...</p>
            ) : batches.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No batches found. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batches.map((batch) => (
                        <Link
                            key={batch.id}
                            to={`/admin/students/batch/${batch.id}`}
                            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100 group"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                        {batch.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Year: {batch.year}</p>
                                </div>
                                <ChevronRight size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Batch Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Create New Batch</h3>
                        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                        <form onSubmit={handleCreateBatch} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Batch 2024"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 2024"
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsManagement;
