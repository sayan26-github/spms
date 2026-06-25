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
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 relative z-10">
                {/* Removed Ambient Aurora Orbs */}

                <header className="flex items-center space-x-4 modern-card p-6 rounded-2xl">
                    <button
                        onClick={handleBackToDashboard}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-brand-muted"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-brand-text">{selectedSubject.name}</h2>
                        <p className="text-brand-muted text-sm">{selectedSubject.code} • Sem {selectedSubject.semester}</p>
                    </div>
                </header>

                <div className="modern-card rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-brand-border flex justify-between items-center bg-slate-50">
                        <h3 className="font-semibold text-lg text-brand-text flex items-center">
                            <BookOpen className="mr-2 text-brand-primary" size={20} />
                            Study Materials
                        </h3>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600/80 text-white rounded-lg hover:bg-indigo-600 transition shadow-sm text-sm font-medium backdrop-blur-sm"
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
        <div className="space-y-6 relative z-10">

            <header className="flex justify-between items-center modern-card p-6 rounded-2xl mb-6">
                <h2 className="text-2xl font-bold text-brand-text">Teacher Dashboard</h2>
                <div className="text-sm text-brand-muted">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Risk Analysis Widget */}
            <RiskAnalysisWidget />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <Link to="/attendance" className="p-5 modern-card rounded-2xl hover:-translate-y-1 transition-all flex items-center space-x-4 group">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-brand-text">Manage Attendance</h3>
                        <p className="text-xs text-brand-muted mt-1">View sessions & mark attendance</p>
                    </div>
                </Link>

                <Link to="/assessments" className="p-5 modern-card rounded-2xl hover:-translate-y-1 transition-all flex items-center space-x-4 group">
                    <div className="p-3 bg-fuchsia-50 rounded-xl text-fuchsia-600 group-hover:bg-fuchsia-100 transition-colors">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-brand-text">Manage Assessments</h3>
                        <p className="text-xs text-brand-muted mt-1">Create tests & upload marks</p>
                    </div>
                </Link>

                <Link to="/messages" className="p-5 modern-card rounded-2xl hover:-translate-y-1 transition-all flex items-center space-x-4 group">
                    <div className="p-3 bg-teal-50 rounded-xl text-teal-600 group-hover:bg-teal-100 transition-colors">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-brand-text">Messages</h3>
                        <p className="text-xs text-brand-muted mt-1">Inbox & Alerts</p>
                    </div>
                </Link>

                <Link to="/assignments" className="p-5 modern-card rounded-2xl hover:-translate-y-1 transition-all flex items-center space-x-4 group">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-brand-text">Assignments</h3>
                        <p className="text-xs text-brand-muted mt-1">Distribute & Grade work</p>
                    </div>
                </Link>
            </div>

            {/* Subjects Section */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <h3 className="text-xl font-bold text-brand-text flex items-center">
                        <BookOpen className="mr-2 text-brand-primary" size={20} /> My Subjects
                    </h3>
                    <p className="text-sm text-brand-muted">Select a subject to manage resources</p>
                </div>

                {loading ? (
                    <div className="animate-pulse flex space-x-4">
                        <div className="h-32 w-full modern-card rounded-2xl"></div>
                    </div>
                ) : subjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((sub) => (
                            <div
                                key={sub.id}
                                onClick={() => handleSubjectClick(sub)}
                                className="modern-card p-6 rounded-2xl hover:border-indigo-300 transition-all hover:-translate-y-1 cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-bold text-brand-text group-hover:text-brand-primary transition-colors">{sub.name}</h4>
                                    <span className="bg-slate-100 text-brand-muted text-xs font-semibold px-2.5 py-1 rounded-lg border border-brand-border">{sub.code}</span>
                                </div>

                                <div className="flex justify-between text-sm text-brand-muted mt-6 pt-4 border-t border-brand-border">
                                    <span>Credits: {sub.credits || 4}</span>
                                    <span>Sem: {sub.semester}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center modern-card rounded-2xl text-brand-muted border-dashed">
                        You are not assigned to any subjects yet.
                    </div>
                )}
            </section>
        </div>
    );
};

export default TeacherDashboard;
