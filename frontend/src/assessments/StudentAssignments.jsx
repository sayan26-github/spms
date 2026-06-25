import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Download, ChevronRight, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assignmentService } from '../services/assignmentService';

export default function StudentAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, submissionsRes] = await Promise.all([
                assignmentService.getMyAssignments(),
                assignmentService.getMySubmissions()
            ]);
            setAssignments(assignmentsRes?.results || assignmentsRes || []);
            setSubmissions(submissionsRes?.results || submissionsRes || []);
        } catch (error) {
            console.error("Failed to load assignments", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (assignment) => {
        const submission = submissions.find(s => s.assignment === assignment.id);
        const dueDate = new Date(assignment.due_date);
        const isPastDue = new Date() > dueDate;

        if (submission) {
            if (submission.marks_obtained !== null) {
                return { 
                    label: `Graded: ${submission.marks_obtained}/${assignment.max_marks}`, 
                    color: 'text-emerald-700 bg-emerald-100 border-emerald-200',
                    icon: <CheckCircle size={14} />
                };
            }
            return { 
                label: 'Submitted', 
                color: 'text-indigo-700 bg-indigo-100 border-indigo-200',
                icon: <CheckCircle size={14} />
            };
        }

        if (isPastDue) {
            return { 
                label: 'Missing', 
                color: 'text-red-700 bg-red-100 border-red-200',
                icon: <AlertCircle size={14} />
            };
        }

        return { 
            label: 'Pending', 
            color: 'text-amber-700 bg-amber-100 border-amber-200',
            icon: <Clock size={14} />
        };
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-brand-text mb-1">My Assignments</h1>
                <p className="text-brand-muted">View pending assignments and submit your work.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : assignments.length === 0 ? (
                <div className="modern-card rounded-xl p-12 text-center">
                    <BookOpen size={48} className="mx-auto text-brand-muted mb-4" />
                    <h3 className="text-lg font-medium text-brand-text mb-2">No Assignments</h3>
                    <p className="text-brand-muted">You have no active assignments right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {assignments.map(assignment => {
                        const status = getStatusInfo(assignment);
                        const dueDate = new Date(assignment.due_date);
                        const isPastDue = new Date() > dueDate;
                        const submission = submissions.find(s => s.assignment === assignment.id);

                        return (
                            <Link 
                                to={`/student/assignments/${assignment.id}/submit`}
                                key={assignment.id} 
                                className="modern-card rounded-xl p-5 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                            >
                                <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md">
                                            {assignment.subject_details?.code || `Subject ID: ${assignment.subject}`}
                                        </span>
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${status.color}`}>
                                            {status.icon}
                                            {status.label}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-brand-text group-hover:text-brand-primary transition-colors">{assignment.title}</h3>
                                    
                                    <div className="flex items-center gap-4 mt-3 text-sm">
                                        <div className={`flex items-center gap-1.5 ${isPastDue && !submission ? 'text-red-500 font-medium' : 'text-brand-muted'}`}>
                                            <Calendar size={16} />
                                            <span>Due: {dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-brand-muted">
                                            <FileText size={16} />
                                            <span>Max Marks: {assignment.max_marks}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-end text-brand-muted group-hover:text-brand-primary transition-colors">
                                    <ChevronRight size={24} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
