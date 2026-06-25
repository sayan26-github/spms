import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import attendanceService from '../services/attendanceService';
import academicService from '../services/academicService';

const StudentAttendance = () => {
    const [searchParams] = useSearchParams();
    const subjectId = searchParams.get('subject');

    const [attendance, setAttendance] = useState([]);
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch specific subject details first if we have an ID
                if (subjectId) {
                    // Ideally we'd have a getSubjectById but for now get list and find
                    const subjects = await academicService.getSubjects();
                    const subs = Array.isArray(subjects) ? subjects : subjects.results || [];
                    const found = subs.find(s => s.id.toString() === subjectId);
                    if (found) setSubject(found);
                }

                // Fetch all attendance records (API returns all for student)
                const data = await attendanceService.getAttendance();
                // If subjectId is present, filter by it
                const allRecords = Array.isArray(data) ? data : data.results || [];

                if (subjectId) {
                    setAttendance(allRecords.filter(r => r.class_session_details.subject === parseInt(subjectId) || r.class_session_details.subject?.id === parseInt(subjectId)));
                } else {
                    setAttendance(allRecords);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [subjectId]);

    const calculatePercentage = () => {
        if (attendance.length === 0) return 0;
        const present = attendance.filter(r => r.status === 'PRESENT').length;
        return ((present / attendance.length) * 100).toFixed(1);
    };

    if (loading) return <div className="p-8 text-center">Loading attendance records...</div>;

    const percentage = calculatePercentage();
    const isLowAttendance = percentage < 75;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center">
                    <Link to="/student/dashboard" className="mr-4 text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Attendance {subject ? `- ${subject.name}` : ''}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Track your class participation
                        </p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-lg ${isLowAttendance ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    <span className="text-sm font-medium">Overall Attendance</span>
                    <div className="text-2xl font-bold">{percentage}%</div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {attendance.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No attendance records found.</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {attendance.map((record) => (
                            <li key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${record.status === 'PRESENT' ? 'bg-green-100' :
                                            record.status === 'ABSENT' ? 'bg-red-100' : 'bg-yellow-100'
                                            }`}>
                                            {record.status === 'PRESENT' ? (
                                                <CheckCircle className="h-6 w-6 text-green-600" />
                                            ) : record.status === 'ABSENT' ? (
                                                <XCircle className="h-6 w-6 text-red-600" />
                                            ) : (
                                                <Clock className="h-6 w-6 text-yellow-600" />
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {new Date(record.class_session_details.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Topic: {record.class_session_details.topic || 'Regular Session'}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                            record.status === 'ABSENT' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {record.status}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default StudentAttendance;
