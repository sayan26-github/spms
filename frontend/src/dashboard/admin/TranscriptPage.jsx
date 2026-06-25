import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ChevronLeft, Award, BookOpen, GraduationCap, CalendarDays, User, Mail } from 'lucide-react';
import assessmentService from '../../services/assessmentService';

const TranscriptPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [transcript, setTranscript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTranscript = async () => {
            try {
                const data = await assessmentService.getTranscript(studentId);
                setTranscript(data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load transcript');
            } finally {
                setLoading(false);
            }
        };
        fetchTranscript();
    }, [studentId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-10 text-center text-brand-muted">Generating Official Transcript...</div>;
    if (error) return <div className="p-10 text-center text-red-500 bg-red-50 rounded-xl m-8">{error}</div>;
    if (!transcript) return null;

    const { student, overall_cgpa, overall_attendance_percentage, semesters } = transcript;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Action Bar (Hidden when printing) */}
            <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-brand-border shadow-sm">
                <button onClick={() => navigate(-1)} className="flex items-center text-brand-muted hover:text-brand-primary font-medium transition-colors">
                    <ChevronLeft size={18} className="mr-1" /> Back to Students
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={handlePrint} className="flex items-center px-5 py-2.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors">
                        <Printer size={18} className="mr-2" /> Print / Download PDF
                    </button>
                </div>
            </div>

            {/* Official Transcript Document */}
            <div id="transcript-doc" className="bg-white p-10 sm:p-16 rounded-2xl border border-brand-border shadow-xl print:shadow-none print:border-none print:p-0">
                
                {/* University Header */}
                <div className="text-center mb-10 pb-10 border-b-2 border-brand-primary/20 relative">
                    <div className="absolute top-0 left-0 hidden print:block">
                        <div className="w-16 h-16 rounded-xl bg-brand-primary flex items-center justify-center">
                            <span className="text-2xl font-extrabold text-white">S</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-brand-text tracking-tight uppercase">SBM University</h1>
                    <p className="text-lg text-brand-muted font-medium mt-2 uppercase tracking-widest">Official Academic Transcript</p>
                </div>

                {/* Student Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 rounded-xl border border-brand-border">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-1">Student Name</p>
                            <p className="text-xl font-bold text-brand-text flex items-center">
                                <User size={18} className="mr-2 text-brand-primary" /> {student.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-1">Registration Number</p>
                            <p className="text-lg font-mono text-brand-text flex items-center">
                                {student.registration_number}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-1">Department</p>
                            <p className="text-lg font-medium text-brand-text flex items-center">
                                <BookOpen size={18} className="mr-2 text-brand-primary" /> {student.department}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-1">Batch / Year</p>
                            <p className="text-lg font-medium text-brand-text flex items-center">
                                <CalendarDays size={18} className="mr-2 text-brand-primary" /> {student.batch}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overall Performance */}
                <div className="flex flex-col sm:flex-row gap-6 mb-12">
                    <div className="flex-1 bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                        <Award size={100} className="absolute -right-4 -bottom-4 text-white opacity-10" />
                        <p className="text-indigo-100 font-semibold uppercase tracking-wider text-sm mb-1">Cumulative GPA (CGPA)</p>
                        <p className="text-5xl font-black">{overall_cgpa.toFixed(2)}</p>
                    </div>
                    <div className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                        <GraduationCap size={100} className="absolute -right-4 -bottom-4 text-white opacity-10" />
                        <p className="text-emerald-100 font-semibold uppercase tracking-wider text-sm mb-1">Overall Attendance</p>
                        <p className="text-5xl font-black">{overall_attendance_percentage.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Semester by Semester Breakdown */}
                <div className="space-y-12">
                    {semesters.map((sem) => (
                        <div key={sem.semester} className="break-inside-avoid">
                            <div className="flex items-end justify-between border-b-2 border-brand-border pb-3 mb-5">
                                <h3 className="text-2xl font-bold text-brand-text">Semester {sem.semester}</h3>
                                <div className="text-right">
                                    <span className="text-sm text-brand-muted font-semibold mr-4">Attendance: <span className={sem.attendance_percentage < 75 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{sem.attendance_percentage}%</span></span>
                                    <span className="text-sm text-brand-muted font-semibold">SGPA: <span className="text-brand-primary font-bold text-lg">{sem.sgpa.toFixed(2)}</span></span>
                                </div>
                            </div>
                            
                            {sem.subjects.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-brand-muted text-xs uppercase tracking-wider font-semibold border-y border-brand-border">
                                            <th className="py-3 px-4 w-24">Code</th>
                                            <th className="py-3 px-4">Subject Name</th>
                                            <th className="py-3 px-4 text-center">Marks</th>
                                            <th className="py-3 px-4 text-center">Grade</th>
                                            <th className="py-3 px-4 text-center">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border/50 text-sm">
                                        {sem.subjects.map((subj) => (
                                            <tr key={subj.code} className="hover:bg-slate-50/50">
                                                <td className="py-3 px-4 font-mono text-brand-muted">{subj.code}</td>
                                                <td className="py-3 px-4 font-medium text-brand-text">{subj.name}</td>
                                                <td className="py-3 px-4 text-center text-brand-muted">{subj.obtained} / {subj.max}</td>
                                                <td className="py-3 px-4 text-center font-bold text-brand-text">{subj.grade}</td>
                                                <td className="py-3 px-4 text-center font-semibold text-brand-primary">{subj.grade_points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-brand-muted text-sm italic py-4">No marks recorded for this semester.</p>
                            )}
                        </div>
                    ))}

                    {semesters.length === 0 && (
                        <div className="text-center py-12 text-brand-muted border-2 border-dashed border-brand-border rounded-xl">
                            No academic records found for this student.
                        </div>
                    )}
                </div>

                {/* Footer / Signatures */}
                <div className="mt-20 pt-10 border-t border-brand-border flex justify-between items-end print:mt-auto text-sm text-brand-muted font-medium">
                    <div>
                        <p>Generated on: {new Date().toLocaleDateString()}</p>
                        <p className="text-xs mt-1">SBM University Student Performance Management System</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b border-brand-muted mb-2"></div>
                        <p>Authorized Signature</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TranscriptPage;
