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
    BarChart3,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import AdminProfileModal from './AdminProfileModal';
import { useState } from 'react';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

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
        <div className="flex h-screen bg-brand-bg relative overflow-hidden">
            {/* Ambient Background (Optional gentle pattern could go here, but omitted for Minimalist Frost) */}

            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-brand-border flex flex-col relative z-20 shadow-sm">
                {/* Logo area */}
                <div className="p-5 border-b border-brand-border flex items-center space-x-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center shadow-md shadow-indigo-600/20">
                        <span className="text-lg font-extrabold text-white">S</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-brand-text tracking-wide">SPMS</h1>
                        <p className="text-[11px] text-brand-muted leading-none">College Administration</p>
                    </div>
                </div>

                {/* User card */}
                <div
                    onClick={() => setIsProfileOpen(true)}
                    className="mx-4 mt-5 mb-4 px-4 py-3 rounded-xl bg-slate-50 border border-brand-border cursor-pointer hover:bg-slate-100 transition-colors group"
                >
                    <p className="text-[10px] text-brand-muted uppercase font-semibold tracking-wider mb-1 group-hover:text-brand-primary transition-colors">Logged in as</p>
                    <p className="font-semibold text-sm truncate text-brand-text">
                        {user?.first_name} {user?.last_name}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {user?.role}
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActivePath(item);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                    ? 'bg-brand-primaryLight text-brand-primary shadow-sm'
                                    : 'text-brand-muted hover:bg-slate-50 hover:text-brand-text'
                                    }`}
                            >
                                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                                <span>{item.label}</span>
                                {active && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions (Manage Admins & Logout) */}
                <div className="p-4 border-t border-brand-border space-y-1">
                    <Link
                        to="/admin/manage-admins"
                        className={`flex items-center space-x-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-colors ${isActivePath({ path: '/admin/manage-admins', exact: true })
                                ? 'bg-brand-primaryLight text-brand-primary shadow-sm'
                                : 'text-brand-muted hover:bg-slate-50 hover:text-brand-text'
                            }`}
                    >
                        <ShieldCheck size={18} strokeWidth={isActivePath({ path: '/admin/manage-admins', exact: true }) ? 2.5 : 2} />
                        <span>Manage Admins</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-3 py-2.5 w-full text-brand-muted hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium cursor-pointer transition-colors"
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

            {/* Modals */}
            <AdminProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </div>
    );
};

export default AdminLayout;
