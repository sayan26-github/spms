import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import {
    Users, GraduationCap, BookOpen, ClipboardList,
    Layers, Building, ArrowRight, TrendingUp
} from 'lucide-react';

const STAT_CARDS = [
    { key: 'total_students', label: 'Students', icon: GraduationCap, gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/20', link: '/admin/students' },
    { key: 'total_teachers', label: 'Teachers', icon: Users, gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20', link: '/admin/teachers' },
    { key: 'total_subjects', label: 'Subjects', icon: BookOpen, gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20', link: '/admin/subjects' },
    { key: 'total_enrollments', label: 'Active Enrollments', icon: ClipboardList, gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
    { key: 'total_batches', label: 'Batches', icon: Layers, gradient: 'from-sky-500 to-cyan-500', shadow: 'shadow-sky-500/20' },
    { key: 'total_departments', label: 'Departments', icon: Building, gradient: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/20' },
];

const QUICK_ACTIONS = [
    { label: 'Manage Students', icon: GraduationCap, path: '/admin/students', desc: 'Add, edit, or remove students' },
    { label: 'Manage Subjects', icon: BookOpen, path: '/admin/subjects', desc: 'Configure courses and subjects' },
    { label: 'Enrollments', icon: ClipboardList, path: '/admin/enrollments', desc: 'Assign students to subjects' },
];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await adminService.getDashboardStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to load dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-brand-text tracking-tight">
                    Dashboard
                </h1>
                <p className="text-sm text-brand-muted mt-1">Overview of your institution's performance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {STAT_CARDS.map(({ key, label, icon: Icon, gradient, shadow, link }, idx) => {
                    const value = loading ? '…' : (stats?.[key] ?? '—');
                    return (
                        <button
                            key={key}
                            onClick={link ? () => navigate(link) : undefined}
                            className={`group relative modern-card rounded-2xl p-5 text-left animate-fade-in stagger-${idx + 1} ${link ? 'cursor-pointer' : 'cursor-default'} transition-all hover:-translate-y-1`}
                            style={{ opacity: 0 }}
                        >
                            <div className="flex items-start justify-between">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} shadow-sm flex items-center justify-center`}>
                                    <Icon className="text-white" size={20} strokeWidth={2.5} />
                                </div>
                                {link && (
                                    <ArrowRight size={16} className="text-brand-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
                                )}
                            </div>
                            <p className="mt-4 text-3xl font-extrabold text-brand-text tracking-tight">
                                {value}
                            </p>
                            <p className="text-sm text-brand-muted mt-0.5 font-medium">{label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="modern-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <TrendingUp size={18} className="text-brand-primary" />
                    <h2 className="text-lg font-bold text-brand-text">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {QUICK_ACTIONS.map(({ label, icon: Icon, path, desc }) => (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className="group flex items-start gap-4 p-4 rounded-xl border border-brand-border hover:border-indigo-300 hover:bg-slate-50 text-left cursor-pointer transition-all focus-glow"
                        >
                            <div className="w-10 h-10 rounded-xl bg-brand-primaryLight flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                                <Icon className="text-brand-primary" size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-brand-text">{label}</p>
                                <p className="text-xs text-brand-muted mt-1">{desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
