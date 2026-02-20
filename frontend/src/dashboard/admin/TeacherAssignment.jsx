import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { ChevronLeft, Save, Check } from 'lucide-react';

const TeacherAssignment = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subjectsData, teachersData] = await Promise.all([
                adminService.getSubjects(),
                adminService.getTeachers()
            ]);
            setSubjects(subjectsData.results || subjectsData);
            setTeachers(teachersData.results || teachersData);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (subjectId, teacherId) => {
        setSaving((prev) => ({ ...prev, [subjectId]: true }));
        try {
            const updated = await adminService.assignTeacher(subjectId, teacherId);
            setSubjects((prev) =>
                prev.map((s) => (s.id === subjectId ? { ...s, teacher: updated.teacher, teacher_name: updated.teacher_name } : s))
            );
        } catch (err) {
            alert('Failed to assign teacher: ' + (err.response?.data?.detail || 'Unknown error'));
        } finally {
            setSaving((prev) => ({ ...prev, [subjectId]: false }));
        }
    };

    if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <button onClick={() => navigate('/admin/enrollments')} className="hover:text-indigo-600 flex items-center gap-1">
                    <ChevronLeft size={16} /> Enrollments
                </button>
                <span>/</span>
                <span className="text-gray-800 font-medium">Teacher Assignments</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Teacher Assignments</h2>
            <p className="text-sm text-gray-500 mb-6">Assign a teacher to each subject using the dropdown</p>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Teacher</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {subjects.map((subject) => (
                            <tr key={subject.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{subject.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.semester}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="border border-gray-300 rounded-md p-2 text-sm flex-1"
                                            value={subject.teacher || ''}
                                            onChange={(e) => handleAssign(subject.id, e.target.value)}
                                            disabled={saving[subject.id]}
                                        >
                                            <option value="">-- Unassigned --</option>
                                            {teachers.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.user_details?.first_name} {t.user_details?.last_name} ({t.department})
                                                </option>
                                            ))}
                                        </select>
                                        {saving[subject.id] && (
                                            <span className="text-xs text-gray-400">Saving...</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {subjects.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-400">No subjects found. Create subjects first.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherAssignment;
