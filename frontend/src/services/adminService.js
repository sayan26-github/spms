import api from '../api/axios';

const ADMIN_API = {
    USERS: '/auth/users/',
    ADMINS: '/auth/admins/',
    SUBJECTS: '/academics/subjects/',
    ENROLLMENTS: '/academics/enrollments/',
    TEACHERS: '/academics/teachers/',
    STUDENTS: '/academics/students/',
    DASHBOARD_STATS: '/academics/dashboard-stats/',
    ANALYTICS_OVERVIEW: '/analytics/predictions/admin_overview/',
    RUN_ANALYSIS: '/analytics/predictions/run_analysis/',
};

export const adminService = {
    // Dashboard
    getDashboardStats: async () => {
        const response = await api.get(ADMIN_API.DASHBOARD_STATS);
        return response.data;
    },

    // User Management
    getUsers: async (params = {}) => {
        const response = await api.get(ADMIN_API.USERS, { params });
        return response.data;
    },
    createUser: async (userData) => {
        const response = await api.post(ADMIN_API.USERS, userData);
        return response.data;
    },
    getAdmins: async () => {
        const response = await api.get(ADMIN_API.ADMINS);
        return response.data;
    },
    createAdmin: async (adminData) => {
        const response = await api.post(ADMIN_API.ADMINS, adminData);
        return response.data;
    },
    updateUser: async (id, userData) => {
        const response = await api.patch(`${ADMIN_API.USERS}${id}/`, userData);
        return response.data;
    },
    deleteUser: async (id) => {
        await api.delete(`${ADMIN_API.USERS}${id}/`);
    },

    // Subject Management
    getSubjects: async (params = {}) => {
        const response = await api.get(ADMIN_API.SUBJECTS, { params });
        return response.data;
    },
    createSubject: async (subjectData) => {
        const response = await api.post(ADMIN_API.SUBJECTS, subjectData);
        return response.data;
    },
    deleteSubject: async (id) => {
        await api.delete(`${ADMIN_API.SUBJECTS}${id}/`);
    },

    // Teacher Profiles
    getTeachers: async (params = {}) => {
        const response = await api.get(ADMIN_API.TEACHERS, { params });
        return response.data;
    },

    // Teacher Assignment
    assignTeacher: async (subjectId, teacherId) => {
        const response = await api.post(
            `${ADMIN_API.SUBJECTS}${subjectId}/assign_teacher/`,
            { teacher_id: teacherId }
        );
        return response.data;
    },

    // Student Profiles (filtered)
    getStudents: async (params = {}) => {
        const response = await api.get(ADMIN_API.STUDENTS, { params });
        return response.data;
    },

    // Enrollment Management
    enrollStudent: async (studentId, subjectId) => {
        const response = await api.post(`${ADMIN_API.ENROLLMENTS}enroll/`, {
            student_id: studentId,
            subject_id: subjectId
        });
        return response.data;
    },
    getEnrollments: async () => {
        const response = await api.get(ADMIN_API.ENROLLMENTS);
        return response.data;
    },
    getEnrollmentsBySubject: async (subjectId) => {
        const response = await api.get(`${ADMIN_API.ENROLLMENTS}by_subject/`, {
            params: { subject_id: subjectId }
        });
        return response.data;
    },
    bulkEnroll: async (subjectId, studentIds) => {
        const response = await api.post(`${ADMIN_API.ENROLLMENTS}bulk_enroll/`, {
            subject_id: subjectId,
            student_ids: studentIds
        });
        return response.data;
    },

    // Analytics
    getAdminAnalytics: async () => {
        const response = await api.get(ADMIN_API.ANALYTICS_OVERVIEW);
        return response.data;
    },
    runAnalysis: async () => {
        const response = await api.post(ADMIN_API.RUN_ANALYSIS);
        return response.data;
    }
};

