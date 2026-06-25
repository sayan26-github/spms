import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { assignmentService } from '../services/assignmentService';

export default function AssignmentGrading() {
    const { id } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gradingStates, setGradingStates] = useState({});

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch assignment details and submissions
            const [assignmentsRes, submissionsRes] = await Promise.all([
                assignmentService.getAssignments(), // Usually we'd have a getAssignment(id), but filtering from list is fine for MVP
                assignmentService.getSubmissionsForAssignment(id)
            ]);
            
            const assignmentsList = assignmentsRes?.results || assignmentsRes || [];
            const currentAssignment = assignmentsList.find(a => a.id === parseInt(id));
            setAssignment(currentAssignment);
            
            const subs = submissionsRes?.results || submissionsRes || [];
            setSubmissions(subs);

            // Initialize grading states
            const initialStates = {};
            subs.forEach(s => {
                initialStates[s.id] = {
                    marks: s.marks_obtained !== null ? s.marks_obtained : '',
                    remarks: s.remarks || '',
                    saving: false,
                    saved: s.marks_obtained !== null
                };
            });
            setGradingStates(initialStates);

        } catch (error) {
            console.error("Failed to load grading data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (subId, field, value) => {
        setGradingStates(prev => ({
            ...prev,
            [subId]: { ...prev[subId], [field]: value, saved: false }
        }));
    };

    const handleSaveGrade = async (subId) => {
        const state = gradingStates[subId];
        if (state.marks === '') return;

        try {
            setGradingStates(prev => ({ ...prev, [subId]: { ...prev[subId], saving: true } }));
            await assignmentService.gradeSubmission(subId, state.marks, state.remarks);
            setGradingStates(prev => ({ ...prev, [subId]: { ...prev[subId], saving: false, saved: true } }));
            
            // Re-fetch to update stats if needed, or just rely on local state
            fetchData(); 
        } catch (error) {
            console.error("Failed to save grade", error);
            alert("Error saving grade. Ensure marks are valid.");
            setGradingStates(prev => ({ ...prev, [subId]: { ...prev[subId], saving: false } }));
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
    const gradedCount = submissions.filter(s => s.marks_obtained !== null).length;

    return (
        <div className="p-6">
            <Link to="/teacher/assignments" className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-primary transition-colors mb-6 font-medium">
                <ArrowLeft size={18} />
                Back to Assignments
            </Link>

            <div className="modern-card rounded-xl p-6 mb-8 bg-gradient-to-br from-white to-indigo-50/30">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <span className="text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full mb-3 inline-block">
                            {assignment.subject_details?.code || `Subject ID: ${assignment.subject}`}
                        </span>
                        <h1 className="text-2xl font-bold text-brand-text mb-2">{assignment.title}</h1>
                        <p className="text-brand-muted text-sm max-w-2xl">{assignment.description}</p>
                    </div>
                    
                    <div className="flex gap-4 md:text-right">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-surface/50">
                            <p className="text-xs text-brand-muted mb-1 font-medium uppercase tracking-wider">Submissions</p>
                            <p className="text-2xl font-bold text-brand-text">{submissions.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-surface/50">
                            <p className="text-xs text-brand-muted mb-1 font-medium uppercase tracking-wider">Graded</p>
                            <p className="text-2xl font-bold text-emerald-600">{gradedCount} <span className="text-sm font-medium text-brand-muted">/ {submissions.length}</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modern-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 border-b border-brand-surface/50">
                            <tr>
                                <th className="p-4 font-semibold text-brand-text text-sm">Student</th>
                                <th className="p-4 font-semibold text-brand-text text-sm">Submitted At</th>
                                <th className="p-4 font-semibold text-brand-text text-sm text-center">File</th>
                                <th className="p-4 font-semibold text-brand-text text-sm">Marks (Max {assignment.max_marks})</th>
                                <th className="p-4 font-semibold text-brand-text text-sm w-1/4">Remarks</th>
                                <th className="p-4 font-semibold text-brand-text text-sm text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-surface/30">
                            {submissions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-brand-muted">
                                        No submissions yet.
                                    </td>
                                </tr>
                            ) : submissions.map(sub => {
                                const submittedAt = new Date(sub.created_at);
                                const isLate = submittedAt > dueDate;
                                const state = gradingStates[subId = sub.id] || {};

                                return (
                                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-brand-text">{sub.student_name}</div>
                                            <div className="text-xs text-brand-muted">{sub.registration_number}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className={`flex items-center gap-1.5 text-sm ${isLate ? 'text-red-500 font-medium' : 'text-brand-muted'}`}>
                                                {isLate ? <AlertTriangle size={14} /> : <Clock size={14} />}
                                                {submittedAt.toLocaleDateString()} {submittedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            {isLate && <div className="text-xs text-red-500 mt-0.5">Late Submission</div>}
                                        </td>
                                        <td className="p-4 text-center">
                                            <a 
                                                href={sub.file} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-brand-primary hover:bg-indigo-100 rounded-md transition-colors text-sm font-medium"
                                            >
                                                <FileText size={16} />
                                                View
                                            </a>
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="number"
                                                className="input-field w-24 py-1.5 text-center"
                                                placeholder={`/ ${assignment.max_marks}`}
                                                value={state.marks}
                                                onChange={(e) => handleGradeChange(sub.id, 'marks', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="text"
                                                className="input-field w-full py-1.5"
                                                placeholder="Optional feedback..."
                                                value={state.remarks}
                                                onChange={(e) => handleGradeChange(sub.id, 'remarks', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleSaveGrade(sub.id)}
                                                disabled={state.saving || state.marks === ''}
                                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                                    state.saved 
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                                        : 'bg-brand-primary text-white hover:bg-indigo-600 disabled:opacity-50'
                                                }`}
                                            >
                                                {state.saving ? 'Saving...' : state.saved ? 'Update' : 'Save Grade'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
