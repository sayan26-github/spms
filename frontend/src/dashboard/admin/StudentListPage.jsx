import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import studentService from '../../services/studentService';
import batchService from '../../services/batchService';
import departmentService from '../../services/departmentService';
import { Plus, ChevronLeft, UserPlus, Users, Mail, FileText } from 'lucide-react';

const StudentListPage = () => {
    const { batchId, deptId } = useParams();
    const navigate = useNavigate();
    const [batch, setBatch] = useState(null);
    const [dept, setDept] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        registration_number: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        batch_id: '',
        department_id: ''
    });

    useEffect(() => {
        fetchData();
    }, [batchId, deptId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [batchList, deptList, studentsData] = await Promise.all([
                batchService.getAll(),
                departmentService.getByBatch(batchId),
                studentService.getByBatchAndDept(batchId, deptId)
            ]);

            const batchesArr = Array.isArray(batchList) ? batchList : batchList?.results || [];
            const deptsArr = Array.isArray(deptList) ? deptList : deptList?.results || [];
            const studentsArr = Array.isArray(studentsData) ? studentsData : studentsData?.results || [];

            setBatch(batchesArr.find(b => String(b.id) === String(batchId)) || { name: `Batch ${batchId}` });
            setDept(deptsArr.find(d => String(d.id) === String(deptId)) || { name: `Department ${deptId}` });
            setStudents(studentsArr);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await adminService.createUser({
                ...formData,
                batch_id: batchId,
                department_id: deptId
            });
            setShowModal(false);
            setFormData({
                registration_number: '', first_name: '', last_name: '',
                email: '', password: '', role: 'STUDENT', batch_id: '', department_id: ''
            });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create student');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const modal = showModal ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="modern-card w-full max-w-md rounded-2xl shadow-2xl animate-fade-in relative flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text">Add Student to {dept?.name}</h2>
                    <button onClick={() => setShowModal(false)} className="text-brand-muted hover:bg-slate-100 p-2 rounded-lg">
                        <Plus size={20} className="rotate-45" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                    )}
                    <form id="student-form" onSubmit={handleCreateStudent} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Registration Number *</label>
                            <input name="registration_number" placeholder="e.g. STU001" value={formData.registration_number} onChange={handleInputChange} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-brand-text">First Name *</label>
                                <input name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleInputChange} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-brand-text">Last Name *</label>
                                <input name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleInputChange} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Email *</label>
                            <input name="email" type="email" placeholder="student@institute.edu" value={formData.email} onChange={handleInputChange} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-brand-text">Password *</label>
                            <input name="password" type="password" placeholder="Secure password" value={formData.password} onChange={handleInputChange} className="w-full modern-input rounded-xl px-4 py-2 text-sm" required />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-brand-border bg-slate-50 flex justify-end space-x-3 rounded-b-2xl">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-semibold text-brand-muted hover:bg-slate-200 rounded-xl">
                        Cancel
                    </button>
                    <button type="submit" form="student-form" className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-indigo-700 rounded-xl shadow-sm">
                        Create
                    </button>
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-brand-muted flex-wrap">
                <button onClick={() => navigate('/admin/students')} className="hover:text-brand-primary flex items-center gap-1 transition-colors">
                    <ChevronLeft size={16} /> All Batches
                </button>
                <span>/</span>
                <button onClick={() => navigate(`/admin/students/batch/${batchId}`)} className="hover:text-brand-primary transition-colors">
                    {batch?.name}
                </button>
                <span>/</span>
                <span className="text-brand-text font-medium">{dept?.name}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text">{dept?.name} — Students</h1>
                    <p className="text-sm text-brand-muted mt-1">{batch?.name}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2.5 bg-brand-primary text-white rounded-xl shadow-sm hover:bg-indigo-700 transition"
                >
                    <UserPlus size={18} className="mr-2" />
                    <span className="font-semibold text-sm">Add Student</span>
                </button>
            </div>

            {loading ? (
                <p className="text-brand-muted text-sm">Loading students...</p>
            ) : students.length === 0 ? (
                <div className="modern-card text-center py-12 rounded-2xl">
                    <Users size={48} className="mx-auto text-brand-muted/40 mb-4" />
                    <p className="text-brand-muted">No students in this department. Add one to get started.</p>
                </div>
            ) : (
                <div className="modern-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Registration ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Semester</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {students.map(s => (
                                    <tr key={s.id} className="group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-brand-primaryLight text-brand-primary flex items-center justify-center font-bold mr-4">
                                                    {s.user_details?.first_name?.[0]}{s.user_details?.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-brand-text">{s.user_details?.first_name} {s.user_details?.last_name}</p>
                                                    <div className="flex items-center text-[11px] text-brand-muted">
                                                        <Mail size={10} className="mr-1" /> {s.user_details?.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 font-mono">
                                                {s.user_details?.registration_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-brand-muted">
                                            {s.semester}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => navigate(`/admin/students/transcript/${s.id}`)}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-primaryLight hover:bg-indigo-100 rounded-lg transition-colors"
                                            >
                                                <FileText size={14} className="mr-1.5" /> Transcript
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {modal}
        </div>
    );
};

export default StudentListPage;
