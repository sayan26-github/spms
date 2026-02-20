import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { departmentService } from '../../services/departmentService';
import batchService from '../../services/batchService';
import { ChevronLeft, ChevronRight, Building } from 'lucide-react';

/**
 * Level 2: Department cards within a batch.
 * Route: /admin/enrollments/students/batch/:batchId
 */
const EnrollDeptPage = () => {
    const navigate = useNavigate();
    const { batchId } = useParams();
    const [departments, setDepartments] = useState([]);
    const [batchName, setBatchName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [deptData, batchData] = await Promise.all([
                    departmentService.getByBatch(batchId),
                    batchService.getAll()
                ]);
                setDepartments(deptData.results || deptData);
                const allBatches = batchData.results || batchData;
                const batch = allBatches.find((b) => String(b.id) === String(batchId));
                setBatchName(batch?.name || `Batch ${batchId}`);
            } catch (err) {
                console.error('Failed to load departments', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [batchId]);

    if (loading) return <div className="text-center py-12 text-gray-500">Loading departments...</div>;

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <button onClick={() => navigate('/admin/enrollments')} className="hover:text-indigo-600 flex items-center gap-1">
                    <ChevronLeft size={16} /> Enrollments
                </button>
                <span>/</span>
                <button onClick={() => navigate('/admin/enrollments/students')} className="hover:text-indigo-600">
                    Students
                </button>
                <span>/</span>
                <span className="text-gray-800 font-medium">{batchName}</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">{batchName} — Departments</h2>
            <p className="text-sm text-gray-500 mb-6">Select a department</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                    <button
                        key={dept.id}
                        onClick={() => navigate(`/admin/enrollments/students/batch/${batchId}/dept/${dept.id}`)}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-md hover:border-indigo-200 transition-all group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center">
                                <Building className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                    {dept.name}
                                </h3>
                                <p className="text-xs text-gray-400">Code: {dept.code}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-indigo-400" size={20} />
                    </button>
                ))}
                {departments.length === 0 && (
                    <p className="text-gray-400 col-span-full text-center py-8">No departments in this batch. Create departments first.</p>
                )}
            </div>
        </div>
    );
};

export default EnrollDeptPage;
