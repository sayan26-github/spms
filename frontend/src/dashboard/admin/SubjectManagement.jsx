import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Plus, Trash, Search, BookOpen } from 'lucide-react';

const SubjectManagement = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        semester: 1
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const data = await adminService.getSubjects();
            setSubjects(data.results || data);
        } catch (error) {
            console.error("Failed to fetch subjects", error);
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
            await adminService.createSubject(formData);
            setShowModal(false);
            setFormData({ name: '', code: '', semester: 1 });
            fetchSubjects();
        } catch (error) {
            alert('Failed to create subject');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this subject?')) {
            try {
                await adminService.deleteSubject(id);
                fetchSubjects();
            } catch (error) {
                console.error("Failed to delete", error);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Subject Management</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                >
                    <BookOpen size={20} /> Add Subject
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {subjects.map((subject) => (
                            <tr key={subject.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{subject.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{subject.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{subject.semester}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{subject.teacher_name || 'Unassigned'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => handleDelete(subject.id)} className="text-red-600 hover:text-red-900">
                                        <Trash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Subject Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Add New Subject</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                                <input name="code" value={formData.code} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Semester</label>
                                <input type="number" name="semester" value={formData.semester} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" min="1" max="8" required />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Subject</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectManagement;
