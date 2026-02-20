import { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import { Link, useNavigate } from "react-router-dom";
import { academicService } from "../services/academicService";
import { assessmentService } from "../services/assessmentService";
import { useAuth } from "../auth/AuthContext";
import { Plus, ClipboardList, ChevronRight, BarChart2 } from "lucide-react";

const AssessmentsPage = () => {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [newMaxMarks, setNewMaxMarks] = useState(100);
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            fetchAssessments(selectedSubject);
        } else {
            setAssessments([]);
        }
    }, [selectedSubject]);

    const fetchSubjects = async () => {
        try {
            const data = await academicService.getSubjects();
            console.log("Fetched Subjects Data:", data); // DEBUG
            const subs = Array.isArray(data) ? data : data.results || [];
            console.log("Parsed Subjects:", subs); // DEBUG
            setSubjects(subs);
            if (subs.length > 0) {
                setSelectedSubject(subs[0].id);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
            alert("Error fetching subjects: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssessments = async (subjectId) => {
        try {
            const data = await assessmentService.getAssessments(subjectId);
            setAssessments(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Error fetching assessments:", error);
        }
    };

    const { user, logout } = useAuth(); // Get user context AND logout function
    const [debugData, setDebugData] = useState(null);

    const handleCreateAssessment = async (e) => {
        // ... (existing code) ...
        e.preventDefault();

        if (!selectedSubject) {
            alert("Please select a subject first.");
            return;
        }

        console.log("Creating Assessment...", { selectedSubject, newName, newMaxMarks, newDate });

        try {
            const assessment = await assessmentService.createAssessment(selectedSubject, newName, newMaxMarks, newDate);
            console.log("Assessment created:", assessment);
            setShowModal(false);
            setNewName("");
            setNewMaxMarks(100);
            fetchAssessments(selectedSubject); // Refresh list
            alert("Assessment Created Successfully!");
        } catch (error) {
            console.error("Creation failed:", error);
            alert("Failed to create assessment: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">


            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Assessments</h2>
                    <p className="text-gray-500">Create tests and manage marks</p>
                </div>
                <div>
                    <div className="flex space-x-2">
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                        >
                            {subjects.length === 0 && <option>No subjects found</option>}
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                            ))}
                        </select>
                        <button onClick={fetchSubjects} title="Refresh Subjects" className="p-2 bg-gray-100 rounded hover:bg-gray-200">
                            Reload
                        </button>
                    </div>
                    {subjects.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">No subjects assigned. Cannot create assessment.</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    New Assessment
                </button>
            </div>

            {
                loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {assessments.length === 0 ? (
                                <li className="px-6 py-4 text-center text-gray-500">No assessments found for this subject.</li>
                            ) : assessments.map((assessment) => (
                                <li key={assessment.id}>
                                    <Link to={`/assessments/${assessment.id}/marks`} className="block hover:bg-gray-50">
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <ClipboardList className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                    <p className="text-sm font-medium text-purple-600 truncate">
                                                        {assessment.name}
                                                    </p>
                                                </div>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        Max Marks: {assessment.max_marks}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        {assessment.date}
                                                    </p>
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                    <BarChart2 className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                    <p>Enter Marks</p>
                                                    <ChevronRight className="ml-1 h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            }

            {/* Modal - Simplified CSS */}
            {
                showModal && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                            <form onSubmit={handleCreateAssessment}>
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-gray-900">Create Assessment</h3>
                                    <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                            placeholder="e.g. Unit Test 1"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Max Marks</label>
                                            <input
                                                type="number"
                                                required
                                                value={newMaxMarks}
                                                onChange={e => setNewMaxMarks(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={newDate}
                                                onChange={e => setNewDate(e.target.value)}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

export default AssessmentsPage;
