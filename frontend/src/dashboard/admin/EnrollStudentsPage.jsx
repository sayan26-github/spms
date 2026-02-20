import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import batchService from '../../services/batchService';
import { departmentService } from '../../services/departmentService';
import { ChevronLeft, Pencil, X, Check } from 'lucide-react';

/**
 * Level 4: Enrolled students list + Edit modal with checklist.
 * Route: /admin/enrollments/students/batch/:batchId/dept/:deptId/subject/:subjectId
 */
const EnrollStudentsPage = () => {
    const navigate = useNavigate();
    const { batchId, deptId, subjectId } = useParams();

    // Context names
    const [batchName, setBatchName] = useState('');
    const [deptName, setDeptName] = useState('');
    const [subjectName, setSubjectName] = useState('');

    // Data
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [allDeptStudents, setAllDeptStudents] = useState([]);

    // Modal
    const [showEdit, setShowEdit] = useState(false);
    const [checkedIds, setCheckedIds] = useState(new Set());
    const [saving, setSaving] = useState(false);

    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [enrollData, batchData, deptData, subjectData] = await Promise.all([
                adminService.getEnrollmentsBySubject(subjectId),
                batchService.getAll(),
                departmentService.getByBatch(batchId),
                adminService.getSubjects()
            ]);

            setEnrolledStudents(enrollData.results || enrollData);

            const allBatches = batchData.results || batchData;
            const batch = allBatches.find((b) => String(b.id) === String(batchId));
            setBatchName(batch?.name || `Batch ${batchId}`);

            const allDepts = deptData.results || deptData;
            const dept = allDepts.find((d) => String(d.id) === String(deptId));
            setDeptName(dept?.name || `Dept ${deptId}`);

            const allSubjects = subjectData.results || subjectData;
            const subject = allSubjects.find((s) => String(s.id) === String(subjectId));
            setSubjectName(subject ? `${subject.name} (${subject.code})` : `Subject ${subjectId}`);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    }, [batchId, deptId, subjectId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openEditModal = async () => {
        try {
            // Fetch all students in this batch + department
            const data = await adminService.getStudents({ batch: batchId, department: deptId });
            const students = data.results || data;
            setAllDeptStudents(students);

            // Pre-check currently enrolled students
            const enrolledIds = new Set(
                (Array.isArray(enrolledStudents) ? enrolledStudents : []).map((e) => e.student)
            );
            setCheckedIds(enrolledIds);
            setShowEdit(true);
        } catch (err) {
            console.error('Failed to load students for edit', err);
            alert('Failed to load students');
        }
    };

    const toggleCheck = (studentId) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                next.add(studentId);
            }
            return next;
        });
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const result = await adminService.bulkEnroll(subjectId, Array.from(checkedIds));
            setEnrolledStudents(result.results || result);
            setShowEdit(false);
        } catch (err) {
            alert('Failed to save enrollments: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data)));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

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
                <button onClick={() => navigate(`/admin/enrollments/students/batch/${batchId}/dept/${deptId}`)} className="hover:text-indigo-600">{deptName}</button>
                <span>/</span>
                <span className="text-gray-800 font-medium">{subjectName}</span>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{subjectName}</h2>
                    <p className="text-sm text-gray-500">
                        Enrolled students — {batchName} / {deptName}
                    </p>
                </div>
                <button
                    onClick={openEditModal}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Pencil size={16} /> Edit Enrollments
                </button>
            </div>

            {/* Enrolled Students Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg. Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled On</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {(Array.isArray(enrolledStudents) ? enrolledStudents : []).map((enrollment, idx) => (
                            <tr key={enrollment.id}>
                                <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{enrollment.student_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{enrollment.student_reg_number || '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(enrollment.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {(!enrolledStudents || enrolledStudents.length === 0) && (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                    No students enrolled yet. Click <strong>Edit Enrollments</strong> to add students.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal — Checklist */}
            {showEdit && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Select Students</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{deptName} students — check to enroll • {allDeptStudents.length} total</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (checkedIds.size === allDeptStudents.length) {
                                            setCheckedIds(new Set());
                                        } else {
                                            setCheckedIds(new Set(allDeptStudents.map((s) => s.id)));
                                        }
                                    }}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
                                >
                                    {checkedIds.size === allDeptStudents.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Checklist */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {allDeptStudents.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">No students in this department.</p>
                            ) : (
                                <div className="space-y-1">
                                    {allDeptStudents.map((student) => {
                                        const isChecked = checkedIds.has(student.id);
                                        return (
                                            <label
                                                key={student.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleCheck(student.id)}
                                                    className="w-4 h-4 text-indigo-600 rounded"
                                                />
                                                <div>
                                                    <span className="font-medium text-gray-800">
                                                        {student.user_details?.first_name} {student.user_details?.last_name}
                                                    </span>
                                                    <span className="text-xs text-gray-400 ml-2">
                                                        {student.user_details?.registration_number}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-xl">
                            <span className="text-sm text-gray-500">{checkedIds.size} selected</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowEdit(false)}
                                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    <Check size={16} />
                                    {saving ? 'Saving...' : 'Save Enrollments'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default EnrollStudentsPage;
