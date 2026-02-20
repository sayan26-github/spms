import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, UserCheck, Award, ChevronRight, ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import academicService from '../services/academicService';
import StudentRiskWidget from './StudentRiskWidget';
import ResourceList from '../components/ResourceList';

const StudentDashboard = ({ user }) => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedSubject, setSelectedSubject] = useState(null);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const data = await academicService.getSubjects();
                setSubjects(Array.isArray(data) ? data : data.results || []);
            } catch (error) {
                console.error("Error fetching subjects:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

    if (selectedSubject) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <header className="flex items-center space-x-4">
                    <button
                        onClick={() => setSelectedSubject(null)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedSubject.name}</h2>
                        <p className="text-gray-500 text-sm">{selectedSubject.code}</p>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                            <BookOpen className="mr-2 text-indigo-600" size={20} />
                            Study Materials & Resources
                        </h3>
                    </div>
                    <div className="p-6">
                        <ResourceList subjectId={selectedSubject.id} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Student Dashboard</h2>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            <StudentRiskWidget />

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.first_name}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Overview of your enrolled subjects and performance.
                    </p>
                </div>
                <Link to="/messages" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium">
                    Messages
                </Link>
            </div>

            {subjects.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    You are not enrolled in any subjects yet.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject) => (
                        <div key={subject.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                                        <BookOpen className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {subject.code}
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900 truncate">
                                                {subject.name}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setSelectedSubject(subject)}
                                        className="col-span-2 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Resources
                                    </button>
                                    <Link
                                        to={`/student/attendance?subject=${subject.id}`}
                                        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Attendance
                                    </Link>
                                    <Link
                                        to={`/student/marks?subject=${subject.id}`}
                                        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                                    >
                                        <Award className="mr-2 h-4 w-4" />
                                        Marks
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
