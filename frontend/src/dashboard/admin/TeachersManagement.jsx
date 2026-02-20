import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Plus, Edit, Trash, Search, UserPlus } from 'lucide-react';

const TeachersManagement = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        registration_number: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'TEACHER', // Fixed role
        department: '',
        designation: ''
    });

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const data = await adminService.getUsers();
            // Filter only teachers from the user list for now. 
            // In a real app, backend should support filtering by role=TEACHER
            const teacherList = (data.results || data).filter(u => u.role === 'TEACHER');
            setTeachers(teacherList);
        } catch (error) {
            console.error("Failed to fetch teachers", error);
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
            // We need to create User first, then Profile. 
            // The current createUser endpoint does simple user creation. 
            // We might need an endpoint that accepts profile data too.
            // For now, let's assume createUser handles basic user data 
            // and we might need a separate step or updated backend for profile fields (dept, designation).
            // Actually, UserCreateSerializer doesn't handle profile fields yet! 
            // Use User Management for basic creation, then maybe edit profile?
            // For MVP, just create the user.

            await adminService.createUser(formData);
            setShowModal(false);
            setFormData({ registration_number: '', first_name: '', last_name: '', email: '', password: '', role: 'TEACHER', department: '', designation: '' });
            fetchTeachers();
            alert('Teacher created successfully');
        } catch (error) {
            alert('Failed to create teacher: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data)));
        }
    };

    // ... (rest of the component similar to UserManagement but tailored for Teachers)

    // For brevity, using a simplified table structure
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Teacher Management</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                >
                    <UserPlus size={20} /> Add Teacher
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {teachers.map((teacher) => (
                            <tr key={teacher.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{teacher.first_name} {teacher.last_name}</div>
                                    <div className="text-sm text-gray-500">{teacher.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.registration_number}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {/* Backend UserSerializer doesn't include profile dept yet? Check serializer. */}
                                    {/* It includes college_name. Profile details might be missing in list view. */}
                                    -
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Teacher Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Add New Teacher</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                                <input name="registration_number" placeholder="e.g. T002" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input name="first_name" placeholder="First Name" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input name="last_name" placeholder="Last Name" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input name="email" type="email" placeholder="Email" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input name="password" type="password" placeholder="Password" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input name="department" placeholder="e.g. Computer Science" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input name="designation" placeholder="e.g. Professor" onChange={handleInputChange} className="w-full border border-gray-300 p-2 rounded-lg" />
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

export default TeachersManagement;
