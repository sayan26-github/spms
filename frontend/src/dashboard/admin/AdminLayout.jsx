import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Users,
    BookOpen,
    LayoutDashboard,
    LogOut,
    GraduationCap,
    MessageSquare,
    ClipboardCheck,
    BarChart3
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { path: '/admin/teachers', icon: Users, label: 'Teachers' },
        { path: '/admin/students', icon: GraduationCap, label: 'Students' },
        { path: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
        { path: '/admin/enrollments', icon: ClipboardCheck, label: 'Enrollments' },
        { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
        { path: '/messages', icon: MessageSquare, label: 'Messages' },
    ];

    const isActivePath = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <div className="w-64 sidebar-bg text-white flex flex-col relative overflow-hidden">
                {/* Subtle decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Logo area */}
                <div className="p-5 border-b border-white/5 flex items-center space-x-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <span className="text-lg font-extrabold text-white">S</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide">SPMS</h1>
                        <p className="text-[11px] text-slate-400 leading-none">College Administration</p>
                    </div>
                </div>

                {/* User card */}
                <div className="mx-4 mt-5 mb-4 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-1">Logged in as</p>
                    <p className="font-semibold text-sm truncate text-white/90">
                        {user?.first_name} {user?.last_name}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                        {user?.role}
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActivePath(item);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                                <span>{item.label}</span>
                                {active && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-3 py-2.5 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-medium cursor-pointer"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
