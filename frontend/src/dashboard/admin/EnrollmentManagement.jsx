import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap } from 'lucide-react';

const EnrollmentManagement = () => {
    const navigate = useNavigate();

    const portals = [
        {
            title: 'Teacher Assignments',
            description: 'Assign teachers to subjects',
            icon: Users,
            color: 'bg-blue-600',
            path: '/admin/enrollments/teachers',
        },
        {
            title: 'Student Enrollments',
            description: 'Enroll students to subjects by Batch & Department',
            icon: GraduationCap,
            color: 'bg-indigo-600',
            path: '/admin/enrollments/students',
        },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Enrollment Management</h2>
            <p className="text-sm text-gray-500 mb-8">Choose a portal to manage assignments</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portals.map((p) => (
                    <button
                        key={p.path}
                        onClick={() => navigate(p.path)}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-left hover:shadow-md hover:border-indigo-200 transition-all group"
                    >
                        <div className={`${p.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                            <p.icon className="text-white" size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                            {p.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EnrollmentManagement;
