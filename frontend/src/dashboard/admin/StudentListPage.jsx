import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import studentService from '../../services/studentService';
import batchService from '../../services/batchService';
import departmentService from '../../services/departmentService';
import { Plus, ChevronLeft, UserPlus, Users } from 'lucide-react';

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

            const batchesArr = batchList.results || batchList;
            const deptsArr = deptList.results || deptList;
            const studentsArr = studentsData.results || studentsData;

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

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
                <button onClick={() => navigate('/admin/students')} className="hover:text-indigo-600 flex items-center gap-1">
                    <ChevronLeft size={16} /> All Batches
                </button>
                <span>/</span>
                <button onClick={() => navigate(`/admin/students/batch/${batchId}`)} className="hover:text-indigo-600">
                    {batch?.name}
                </button>
                <span>/</span>
                <span className="text-gray-800 font-medium">{dept?.name}</span>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{dept?.name} — Students</h2>
                    <p className="text-sm text-gray-500 mt-1">{batch?.name}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <UserPlus size={20} /> Add Student
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">Loading students...</p>
            ) : students.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No students in this department. Add one to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map(s => (
                                <tr key={s.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {s.user_details?.first_name} {s.user_details?.last_name}
                                        </div>
                                        <div className="text-sm text-gray-500">{s.user_details?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {s.user_details?.registration_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {s.semester}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Student Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Add Student to {dept?.name}</h3>
                        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                        <form onSubmit={handleCreateStudent} className="space-y-4">
                            <input name="registration_number" placeholder="Registration Number" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            <input name="first_name" placeholder="First Name" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            <input name="last_name" placeholder="Last Name" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            <input name="email" type="email" placeholder="Email" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            <input name="password" type="password" placeholder="Password" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
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

export default StudentListPage;
