import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { academicService } from "../services/academicService";
import { attendanceService } from "../services/attendanceService";
import { Plus, Calendar, Users, ChevronRight } from "lucide-react";

const AttendancePage = () => {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTopic, setNewTopic] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            fetchSessions(selectedSubject);
        } else {
            setSessions([]);
        }
    }, [selectedSubject]);

    const fetchSubjects = async () => {
        try {
            const data = await academicService.getSubjects();
            const subs = Array.isArray(data) ? data : data.results || [];
            setSubjects(subs);
            if (subs.length > 0) {
                setSelectedSubject(subs[0].id);
            }
        } catch (error) {
            console.error("Error fetching subjects:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async (subjectId) => {
        try {
            const data = await attendanceService.getSessions(subjectId);
            setSessions(Array.isArray(data) ? data : data.results || []);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        try {
            const session = await attendanceService.createSession(selectedSubject, newDate, newTopic);
            setShowModal(false);
            fetchSessions(selectedSubject); // Refresh list
            // Optionally navigate to mark attendance immediately
            navigate(`/attendance/session/${session.id}`);
        } catch (error) {
            alert("Failed to create session: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Class Sessions</h2>
                    <p className="text-gray-500">Manage and mark attendance</p>
                </div>
                <div>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        {subjects.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    New Session
                </button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {sessions.length === 0 ? (
                            <li className="px-6 py-4 text-center text-gray-500">No sessions found for this subject.</li>
                        ) : sessions.map((session) => (
                            <li key={session.id}>
                                <Link to={`/attendance/session/${session.id}`} className="block hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                <p className="text-sm font-medium text-blue-600 truncate">
                                                    {session.date}
                                                </p>
                                            </div>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {session.attendance_count || 0} Students
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    {session.topic || "No Topic"}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <Users className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                <p>View Details</p>
                                                <ChevronRight className="ml-1 h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleCreateSession}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Create New Session</h3>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date</label>
                                            <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Topic</label>
                                            <input type="text" value={newTopic} onChange={e => setNewTopic(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g. Intro to BST" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                                        Create
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
