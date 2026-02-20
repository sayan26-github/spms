import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { departmentService } from '../../services/departmentService';
import batchService from '../../services/batchService';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

/**
 * Level 3: Subject cards within a batch/department context.
 * Route: /admin/enrollments/students/batch/:batchId/dept/:deptId
 */
const EnrollSubjectPage = () => {
    const navigate = useNavigate();
    const { batchId, deptId } = useParams();
    const [subjects, setSubjects] = useState([]);
    const [batchName, setBatchName] = useState('');
    const [deptName, setDeptName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [subjectData, batchData, deptData] = await Promise.all([
                    adminService.getSubjects(),
                    batchService.getAll(),
                    departmentService.getByBatch(batchId)
                ]);
                setSubjects(subjectData.results || subjectData);

                const allBatches = batchData.results || batchData;
                const batch = allBatches.find((b) => String(b.id) === String(batchId));
                setBatchName(batch?.name || `Batch ${batchId}`);

                const allDepts = deptData.results || deptData;
                const dept = allDepts.find((d) => String(d.id) === String(deptId));
                setDeptName(dept?.name || `Dept ${deptId}`);
            } catch (err) {
                console.error('Failed to load subjects', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [batchId, deptId]);

    if (loading) return <div className="text-center py-12 text-gray-500">Loading subjects...</div>;

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
                <button onClick={() => navigate('/admin/enrollments')} className="hover:text-indigo-600 flex items-center gap-1">
                    <ChevronLeft size={16} /> Enrollments
                </button>
                <span>/</span>
                <button onClick={() => navigate('/admin/enrollments/students')} className="hover:text-indigo-600">Students</button>
                <span>/</span>
                <button onClick={() => navigate(`/admin/enrollments/students/batch/${batchId}`)} className="hover:text-indigo-600">{batchName}</button>
                <span>/</span>
                <span className="text-gray-800 font-medium">{deptName}</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">{deptName} — Subjects</h2>
            <p className="text-sm text-gray-500 mb-6">Select a subject to manage enrolled students</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                    <button
                        key={subject.id}
                        onClick={() => navigate(`/admin/enrollments/students/batch/${batchId}/dept/${deptId}/subject/${subject.id}`)}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-md hover:border-indigo-200 transition-all group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center">
                                <BookOpen className="text-emerald-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                    {subject.name}
                                </h3>
                                <p className="text-xs text-gray-400">{subject.code} • Sem {subject.semester}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Teacher: {subject.teacher_name}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-300 group-hover:text-indigo-400" size={20} />
                    </button>
                ))}
                {subjects.length === 0 && (
                    <p className="text-gray-400 col-span-full text-center py-8">No subjects found. Create subjects first.</p>
                )}
            </div>
        </div>
    );
};

export default EnrollSubjectPage;
