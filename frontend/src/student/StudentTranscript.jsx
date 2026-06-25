import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, GraduationCap, FileText, Calendar, Target, UserCheck } from 'lucide-react';
import { assessmentService } from '../services/assessmentService';

const StudentTranscript = () => {
    const navigate = useNavigate();
    const [transcript, setTranscript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTranscript = async () => {
            try {
                const data = await assessmentService.getMyTranscript();
                setTranscript(data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load transcript.');
            } finally {
                setLoading(false);
            }
        };
        fetchTranscript();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-brand-muted font-medium">Loading your academic record...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto py-12 px-4 text-center">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200 inline-block">
                    <p className="font-semibold">{error}</p>
                    <button onClick={() => navigate('/student/dashboard')} className="mt-4 text-sm text-red-800 hover:underline">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!transcript) return null;

    const { student, overall_cgpa, overall_attendance_percentage, semesters } = transcript;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
            {/* Back Button */}
            <button onClick={() => navigate('/student/dashboard')} className="flex items-center text-brand-muted hover:text-brand-primary font-medium transition-colors">
                <ChevronLeft size={18} className="mr-1" /> Back to Dashboard
            </button>

            {/* Header Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 sm:p-10 text-white relative">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
                        <GraduationCap size={250} className="-mr-10 -mt-10" />
                    </div>
                    
                    <div className="relative z-10">
                        <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block backdrop-blur-sm border border-white/20">
                            Academic Transcript
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{student.name}</h1>
                        <p className="text-indigo-100 text-lg flex items-center gap-2">
                            <span>{student.registration_number}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                            <span>{student.department} ({student.batch})</span>
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/50">
                    <div className="p-6 text-center">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Overall CGPA</p>
                        <p className="text-3xl font-black text-indigo-600">{overall_cgpa.toFixed(2)}</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Semesters</p>
                        <p className="text-3xl font-black text-gray-800">{semesters.length}</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Overall Attendance</p>
                        <p className={`text-3xl font-black ${overall_attendance_percentage >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {overall_attendance_percentage.toFixed(1)}%
                        </p>
                    </div>
                    <div className="p-6 text-center flex items-center justify-center">
                        <button className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors bg-indigo-50 px-4 py-2 rounded-xl">
                            <FileText size={18} />
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Semesters Loop */}
            {semesters.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700">No Semester Data Found</h3>
                    <p className="text-gray-500 mt-2">Your academic records for the completed semesters will appear here.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {semesters.map((sem, index) => (
                        <div key={sem.semester} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Semester Header */}
                            <div className="bg-slate-50 border-b border-gray-200 p-5 sm:px-8 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xl">
                                        S{sem.semester}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Semester {sem.semester}</h2>
                                        <p className="text-sm text-gray-500 flex items-center gap-4 mt-0.5">
                                            <span className="flex items-center gap-1.5"><Target size={14}/> {sem.subjects.length} Subjects</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 sm:gap-8">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Semester GPA</p>
                                        <p className="text-xl font-black text-indigo-600">{sem.sgpa.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 font-semibold uppercase">Attendance</p>
                                        <p className={`text-xl font-black ${sem.attendance_percentage >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {sem.attendance_percentage.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Subjects Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold bg-white">
                                            <th className="px-6 py-4 whitespace-nowrap">Subject Code</th>
                                            <th className="px-6 py-4">Subject Name</th>
                                            <th className="px-6 py-4 text-right whitespace-nowrap">Marks Obtained</th>
                                            <th className="px-6 py-4 text-center whitespace-nowrap">Percentage</th>
                                            <th className="px-6 py-4 text-center whitespace-nowrap">Grade</th>
                                            <th className="px-6 py-4 text-center whitespace-nowrap">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sem.subjects.map((subj) => (
                                            <tr key={subj.code} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                                                    {subj.code}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                                    {subj.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-700">
                                                    {subj.obtained.toFixed(1)} / {subj.max.toFixed(1)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-lg
                                                        ${subj.percentage >= 80 ? 'bg-emerald-50 text-emerald-700' : 
                                                          subj.percentage >= 60 ? 'bg-blue-50 text-blue-700' : 
                                                          subj.percentage >= 40 ? 'bg-amber-50 text-amber-700' : 
                                                          'bg-red-50 text-red-700'}`}>
                                                        {subj.percentage.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-black text-gray-900">
                                                    {subj.grade}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-indigo-600">
                                                    {subj.grade_points.toFixed(1)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentTranscript;
