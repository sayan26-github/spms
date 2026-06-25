import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, UploadCloud, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { assignmentService } from '../services/assignmentService';

export default function AssignmentSubmit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, submissionsRes] = await Promise.all([
                assignmentService.getMyAssignments(),
                assignmentService.getMySubmissions()
            ]);
            
            const assignmentsList = assignmentsRes?.results || assignmentsRes || [];
            const currentAssignment = assignmentsList.find(a => a.id === parseInt(id));
            setAssignment(currentAssignment);
            
            const submissionsList = submissionsRes?.results || submissionsRes || [];
            const currentSubmission = submissionsList.find(s => s.assignment === parseInt(id));
            setSubmission(currentSubmission);

        } catch (error) {
            console.error("Failed to load assignment data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert("Please select a file to submit.");

        try {
            setSubmitting(true);
            const data = new FormData();
            data.append('assignment', assignment.id);
            data.append('file', file);

            await assignmentService.submitAssignment(data);
            
            // Reload to show the new submission
            await fetchData();
            setFile(null);
        } catch (error) {
            console.error("Failed to submit assignment", error);
            alert("Error submitting assignment. You may have already submitted or missed a deadline.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!assignment) {
        return <div className="p-6 text-center text-red-500">Assignment not found.</div>;
    }

    const dueDate = new Date(assignment.due_date);
    const isPastDue = new Date() > dueDate;
    const isGraded = submission && submission.marks_obtained !== null;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Link to="/student/assignments" className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-primary transition-colors mb-6 font-medium">
                <ArrowLeft size={18} />
                Back to Assignments
            </Link>

            {/* Assignment Details */}
            <div className="modern-card rounded-2xl p-8 mb-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6 pb-6 border-b border-brand-surface/50">
                    <div>
                        <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full mb-3 inline-block">
                            {assignment.subject_details?.code || `Subject ID: ${assignment.subject}`}
                        </span>
                        <h1 className="text-2xl font-bold text-brand-text mb-2">{assignment.title}</h1>
                        <div className="flex items-center gap-4 text-sm mt-3">
                            <div className={`flex items-center gap-1.5 ${isPastDue && !submission ? 'text-red-500 font-medium' : 'text-brand-muted'}`}>
                                {isPastDue && !submission ? <AlertTriangle size={16} /> : <Clock size={16} />}
                                <span>Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-brand-muted">
                                <FileText size={16} />
                                <span>Max Marks: {assignment.max_marks}</span>
                            </div>
                        </div>
                    </div>
                    
                    {assignment.file && (
                        <a 
                            href={assignment.file} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                        >
                            <Download size={18} />
                            Download Brief
                        </a>
                    )}
                </div>
                
                <div>
                    <h3 className="text-lg font-semibold text-brand-text mb-3">Description</h3>
                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                        {assignment.description || "No description provided."}
                    </div>
                </div>
            </div>

            {/* Submission Area */}
            <div className="modern-card rounded-2xl p-8">
                <h3 className="text-lg font-bold text-brand-text mb-6">Your Submission</h3>

                {submission ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-brand-surface/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <p className="font-medium text-brand-text">Submission Uploaded</p>
                                    <p className="text-xs text-brand-muted mt-1">
                                        Submitted on {new Date(submission.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <a 
                                href={submission.file} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 text-brand-primary hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Download My Submission"
                            >
                                <Download size={20} />
                            </a>
                        </div>

                        {/* Grading Feedback */}
                        {isGraded ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
                                <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-4">
                                    <CheckCircle size={20} />
                                    Graded
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <p className="text-xs text-emerald-600/80 uppercase tracking-wider font-semibold mb-1">Marks Obtained</p>
                                        <p className="text-3xl font-bold text-emerald-700">
                                            {submission.marks_obtained} <span className="text-lg text-emerald-600/50">/ {assignment.max_marks}</span>
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-emerald-600/80 uppercase tracking-wider font-semibold mb-1">Teacher Remarks</p>
                                        <p className="text-emerald-800 italic">"{submission.remarks || "No remarks provided."}"</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl text-sm font-medium">
                                <Clock size={16} />
                                Your submission is pending review by the teacher.
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isPastDue && (
                            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-start gap-3 mb-6">
                                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h4 className="font-semibold text-sm">Late Submission</h4>
                                    <p className="text-xs mt-1">This assignment is past its due date. Your submission will be marked as late.</p>
                                </div>
                            </div>
                        )}

                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 hover:border-indigo-400 transition-colors bg-gray-50/50 flex justify-center">
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-indigo-600 focus-within:outline-none px-3 py-1 shadow-sm border border-gray-200">
                                        <span>Select file</span>
                                        <input type="file" required className="sr-only" onChange={handleFileChange} />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">PDF, DOCX, ZIP (Max 10MB)</p>
                                {file && (
                                    <div className="mt-4 p-3 bg-indigo-50 rounded-lg text-sm font-medium text-indigo-700 inline-block">
                                        Selected: {file.name}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-end">
                            <button 
                                type="submit" 
                                disabled={submitting || !file}
                                className="btn-primary flex items-center gap-2 px-8 py-3 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <UploadCloud size={18} />
                                )}
                                {submitting ? 'Submitting...' : 'Submit Assignment'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
