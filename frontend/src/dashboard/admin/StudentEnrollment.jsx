import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import batchService from '../../services/batchService';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';

/**
 * Level 1: Shows batch cards.
 * Route: /admin/enrollments/students
 */
const StudentEnrollment = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await batchService.getAll();
                setBatches(data.results || data);
            } catch (err) {
                console.error('Failed to load batches', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="text-center py-12 text-gray-500">Loading batches...</div>;

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <button onClick={() => navigate('/admin/enrollments')} className="hover:text-indigo-600 flex items-center gap-1">
                    <ChevronLeft size={16} /> Enrollments
                </button>
                <span>/</span>
                <span className="text-gray-800 font-medium">Student Enrollments</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Batch</h2>
            <p className="text-sm text-gray-500 mb-6">Choose a batch to manage student enrollments</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {batches.map((batch) => (
                    <button
                        key={batch.id}
                        onClick={() => navigate(`/admin/enrollments/students/batch/${batch.id}`)}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-md hover:border-indigo-200 transition-all group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center">
                                <GraduationCap className="text-indigo-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                    {batch.name}
                                </h3>
                                <p className="text-xs text-gray-400">Year: {batch.year}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-indigo-400" size={20} />
                    </button>
                ))}
                {batches.length === 0 && (
                    <p className="text-gray-400 col-span-full text-center py-8">No batches found. Create batches first.</p>
                )}
            </div>
        </div>
    );
};

export default StudentEnrollment;
