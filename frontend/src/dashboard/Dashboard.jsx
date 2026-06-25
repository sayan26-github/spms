import { useAuth } from "../auth/AuthContext";
import { Navigate } from "react-router-dom";
import TeacherDashboard from "./teacher/TeacherDashboard";

import StudentDashboard from "../student/StudentDashboard";

const Dashboard = () => {
    const { user, logout } = useAuth();

    const renderDashboard = () => {
        switch (user?.role) {
            case "TEACHER":
                return <TeacherDashboard user={user} />;
            case "STUDENT":
                return <StudentDashboard user={user} />;
            case "ADMIN":
            case "HEAD":
                return <Navigate to="/admin" replace />;
            default:
                return <div className="p-4 text-center">Unknown Role Dashboard</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow sticky top-0 z-10 transition-shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-2xl mr-2">📚</span>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight border-r pr-4 mr-4 border-gray-300">SPMS</h1>
                            <h2 className="text-lg font-semibold text-gray-700 hidden sm:block">
                                {user?.role === 'STUDENT' ? 'Student Dashboard' : 
                                 user?.role === 'TEACHER' ? 'Teacher Dashboard' : 'Dashboard'}
                            </h2>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-sm text-gray-500 hidden md:block">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                {renderDashboard()}
            </main>
        </div>
    );
};

export default Dashboard;
