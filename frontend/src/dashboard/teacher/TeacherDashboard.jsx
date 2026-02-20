import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { academicService } from "../../services/academicService";
import { BookOpen, Calendar, ClipboardList, PlusCircle, ArrowLeft } from "lucide-react";
import RiskAnalysisWidget from "./RiskAnalysisWidget";
import ResourceList from "../../components/ResourceList";
import ResourceUploadModal from "../../components/ResourceUploadModal";

const TeacherDashboard = ({ user }) => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // to force refresh list

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const data = await academicService.getSubjects();
                setSubjects(Array.isArray(data) ? data : data.results || []);
            } catch (error) {
                console.error("Failed to fetch subjects", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    const handleSubjectClick = (subject) => {
        setSelectedSubject(subject);
    };

    const handleBackToDashboard = () => {
        setSelectedSubject(null);
    };

    if (selectedSubject) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <header className="flex items-center space-x-4">
                    <button
                        onClick={handleBackToDashboard}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedSubject.name}</h2>
                        <p className="text-gray-500 text-sm">{selectedSubject.code} • Sem {selectedSubject.semester}</p>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                            <BookOpen className="mr-2 text-indigo-600" size={20} />
                            Study Materials
                        </h3>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm hover:shadow-md text-sm font-medium"
                        >
                            <PlusCircle size={18} />
                            <span>Add Resource</span>
                        </button>
                    </div>
                    <div className="p-6">
                        <ResourceList key={refreshTrigger} subjectId={selectedSubject.id} />
                    </div>
                </div>

                {showUploadModal && (
                    <ResourceUploadModal
                        subjectId={selectedSubject.id}
                        onClose={() => setShowUploadModal(false)}
                        onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h2>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Risk Analysis Widget */}
            <RiskAnalysisWidget />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/attendance" className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900">Manage Attendance</h3>
                        <p className="text-sm text-blue-700">View sessions & mark attendance</p>
                    </div>
                </Link>

                <Link to="/assessments" className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:shadow-md transition flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-purple-900">Manage Assessments</h3>
                        <p className="text-sm text-purple-700">Create tests & upload marks</p>
                    </div>
                </Link>

                <Link to="/messages" className="p-4 bg-teal-50 border border-teal-200 rounded-lg hover:shadow-md transition flex items-center space-x-4">
                    <div className="p-3 bg-teal-100 rounded-full text-teal-600">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-teal-900">Messages</h3>
                        <p className="text-sm text-teal-700">Inbox & Alerts</p>
                    </div>
                </Link>
            </div>

            {/* Subjects Section */}
            <section>
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <BookOpen className="mr-2" size={20} /> My Subjects
                    </h3>
                    <p className="text-sm text-gray-500">Select a subject to manage resources</p>
                </div>

                {loading ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="h-32 w-full bg-gray-200 rounded-lg"></div>
                    </div>
                ) : subjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((sub) => (
                            <div
                                key={sub.id}
                                onClick={() => handleSubjectClick(sub)}
                                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{sub.name}</h4>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{sub.code}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-600 mt-4 pt-4 border-t border-gray-50">
                                    <span>Credits: {sub.credits || 4}</span>
                                    <span>Sem: {sub.semester}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-lg text-gray-500 border border-dashed border-gray-300">
                        You are not assigned to any subjects yet.
                    </div>
                )}
            </section>
        </div>
    );
};

export default TeacherDashboard;
