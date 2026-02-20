import React, { useState, useEffect } from 'react';
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
                departmentService.getByBatch(batchId)
            ]);
            const batchesArr = batchList.results || batchList;
            const found = batchesArr.find(b => String(b.id) === String(batchId));
            setBatch(found || { name: `Batch ${batchId}`, id: batchId });
            setDepartments(deptsData.results || deptsData);
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

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <button onClick={() => navigate('/admin/students')} className="hover:text-indigo-600 flex items-center gap-1">
                    <ChevronLeft size={16} /> All Batches
                </button>
                <span>/</span>
                <span className="text-gray-800 font-medium">{batch?.name}</span>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{batch?.name} — Departments</h2>
                    <p className="text-sm text-gray-500 mt-1">Select a department to manage students</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} /> Create Department
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading departments...</p>
            ) : departments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <Building size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No departments in this batch. Create one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => (
                        <Link
                            key={dept.id}
                            to={`/admin/students/batch/${batchId}/dept/${dept.id}`}
                            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100 group"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                        {dept.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Code: {dept.code}</p>
                                </div>
                                <ChevronRight size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Department Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Create Department in {batch?.name}</h3>
                        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Computer Science"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. CSE"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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

export default DeptListPage;
