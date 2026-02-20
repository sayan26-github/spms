import React from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, ChevronRight } from 'lucide-react';

const EnrollmentManagement = () => {
    const portals = [
        {
            title: 'Teacher Assignments',
            description: 'Assign qualified teachers to subjects and track allocations.',
            icon: Users,
            accent: 'bg-blue-50 border-blue-200 text-blue-600',
            iconBg: 'bg-blue-600',
            path: '/admin/enrollments/teachers',
        },
        {
            title: 'Student Enrollments',
            description: 'Enroll students to subjects by Batch & Department.',
            icon: GraduationCap,
            accent: 'bg-indigo-50 border-indigo-200 text-indigo-600',
            iconBg: 'bg-brand-primary',
            path: '/admin/enrollments/students',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-brand-text">Enrollment Management</h1>
                <p className="text-sm text-brand-muted mt-1">Manage teacher assignments and student course enrollments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portals.map((p) => {
                    const Icon = p.icon;
                    return (
                        <Link
                            key={p.path}
                            to={p.path}
                            className="modern-card rounded-2xl p-8 flex flex-col group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div className={`${p.iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-sm`}>
                                <Icon className="text-white" size={22} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-brand-text group-hover:text-brand-primary transition-colors">
                                    {p.title}
                                </h3>
                                <p className="text-sm text-brand-muted mt-1 leading-relaxed">{p.description}</p>
                            </div>
                            <div className={`mt-5 flex items-center text-sm font-semibold ${p.accent.split(' ').pop()} group-hover:gap-2 transition-all`}>
                                <span>Go to {p.title}</span>
                                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default EnrollmentManagement;
