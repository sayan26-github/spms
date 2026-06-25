import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Plus, Calendar, Clock, Download, ChevronRight, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assignmentService } from '../services/assignmentService';
import { academicService } from '../services/academicService';
import { useAuth } from '../auth/AuthContext';

export default function TeacherAssignments() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        subject: '',
        title: '',
        description: '',
        due_date: '',
        max_marks: 100,
        file: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, subjectsRes] = await Promise.all([
                assignmentService.getAssignments(),
                academicService.getSubjects()
            ]);
            setAssignments(assignmentsRes?.results || assignmentsRes || []);
            setSubjects(subjectsRes?.results || subjectsRes || []);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, file: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('subject', formData.subject);
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('due_date', new Date(formData.due_date).toISOString());
            data.append('max_marks', formData.max_marks);
            if (formData.file) {
                data.append('file', formData.file);
            }

            await assignmentService.createAssignment(data);
            setShowModal(false);
            setFormData({ subject: '', title: '', description: '', due_date: '', max_marks: 100, file: null });
            fetchData();
        } catch (error) {
            console.error("Failed to create assignment", error);
            alert("Error creating assignment. Check console for details.");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-brand-text mb-1">Assignments</h1>
                    <p className="text-brand-muted">Create and manage assignments for your subjects</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                >
                    <Plus size={18} />
                    New Assignment
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : assignments.length === 0 ? (
                <div className="modern-card rounded-xl p-12 text-center">
                    <FileText size={48} className="mx-auto text-brand-muted mb-4" />
                    <h3 className="text-lg font-medium text-brand-text mb-2">No Assignments Yet</h3>
                    <p className="text-brand-muted mb-6">You haven't created any assignments for your students.</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary px-6 py-2">
                        Create Your First Assignment
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map(assignment => (
                        <div key={assignment.id} className="modern-card rounded-xl p-6 hover:shadow-lg transition-shadow flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-brand-primary rounded-md mb-2 inline-block">
                                        {assignment.subject_details?.code || `Subject ID: ${assignment.subject}`}
                                    </span>
                                    <h3 className="font-bold text-lg text-brand-text line-clamp-1">{assignment.title}</h3>
                                </div>
                                {assignment.file && (
                                    <a 
                                        href={assignment.file} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="p-2 text-brand-muted hover:text-brand-primary hover:bg-brand-surface rounded-lg transition-colors"
                                        title="Download Brief"
                                    >
                                        <Download size={18} />
                                    </a>
                                )}
                            </div>
                            
                            <p className="text-sm text-brand-muted line-clamp-2 mb-4 flex-grow">
                                {assignment.description || "No description provided."}
                            </p>
                            
                            <div className="flex items-center gap-2 text-sm text-brand-muted mb-6 bg-brand-surface p-3 rounded-lg">
                                <Clock size={16} className="text-amber-500" />
                                <span>Due: {new Date(assignment.due_date).toLocaleDateString()} {new Date(assignment.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            
                            <Link 
                                to={`/teacher/assignments/${assignment.id}/grade`}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-surface text-brand-primary hover:bg-indigo-50 font-medium rounded-lg transition-colors border border-indigo-100"
                            >
                                <UserCheck size={18} />
                                View Submissions & Grade
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Assignment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-brand-surface/50 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-brand-text">Create New Assignment</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Subject</label>
                                <select 
                                    required
                                    className="input-field w-full"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                >
                                    <option value="">Select a subject...</option>
                                    {subjects.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Title</label>
                                <input 
                                    type="text" 
                                    required
                                    className="input-field w-full"
                                    placeholder="e.g., Mid-Term Project"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Description / Instructions</label>
                                <textarea 
                                    className="input-field w-full min-h-[100px]"
                                    placeholder="Provide details about the assignment..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">Due Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        required
                                        className="input-field w-full"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brand-text mb-1">Max Marks</label>
                                    <input 
                                        type="number" 
                                        required
                                        min="1"
                                        className="input-field w-full"
                                        value={formData.max_marks}
                                        onChange={(e) => setFormData({...formData, max_marks: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1">Assignment Brief (Optional)</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-brand-surface border-dashed rounded-xl hover:border-indigo-300 transition-colors bg-gray-50/50">
                                    <div className="space-y-1 text-center">
                                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-indigo-600 focus-within:outline-none px-2">
                                                <span>Upload a file</span>
                                                <input type="file" className="sr-only" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">PDF, DOCX, ZIP up to 10MB</p>
                                        {formData.file && (
                                            <p className="text-sm font-medium text-indigo-600 mt-2">
                                                Selected: {formData.file.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-brand-surface/50 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-6 py-2">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary px-6 py-2">
                                    Create Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
