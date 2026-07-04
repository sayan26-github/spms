import api from '../api/axios';

/**
 * Helper: DRF paginated endpoints return { count, results }.
 * This extracts the array from paginated or plain responses.
 */
const extractResults = (data) => {
    if (data && Array.isArray(data.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
};

const ADMIN_API = {
    USERS: '/auth/users/',
    ADMINS: '/auth/admins/',
    SUBJECTS: '/academics/subjects/',
    ENROLLMENTS: '/academics/enrollments/',
    TEACHERS: '/academics/teachers/',
    STUDENTS: '/academics/students/',
    DASHBOARD_STATS: '/academics/dashboard-stats/',
    ANALYTICS_OVERVIEW: '/analytics/predictions/admin-overview/',
    RUN_ANALYSIS: '/analytics/predictions/run-analysis/',
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
        return extractResults(response.data);
    },
    createUser: async (userData) => {
        const response = await api.post(ADMIN_API.USERS, userData);
        return response.data;
    },
    getAdmins: async () => {
        const response = await api.get(ADMIN_API.ADMINS);
        return extractResults(response.data);
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
        return extractResults(response.data);
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
        return extractResults(response.data);
    },

    // Teacher Assignment
    assignTeacher: async (subjectId, teacherId) => {
        const response = await api.post(
            `${ADMIN_API.SUBJECTS}${subjectId}/assign-teacher/`,
            { teacher_id: teacherId }
        );
        return response.data;
    },

    // Student Profiles (filtered)
    getStudents: async (params = {}) => {
        const response = await api.get(ADMIN_API.STUDENTS, { params });
        return extractResults(response.data);
    },
    bulkImportStudents: async (formData) => {
        const response = await api.post(`${ADMIN_API.USERS}bulk_import/`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
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
        return extractResults(response.data);
    },
    getEnrollmentsBySubject: async (subjectId) => {
        const response = await api.get(`${ADMIN_API.ENROLLMENTS}by-subject/`, {
            params: { subject_id: subjectId }
        });
        return response.data;
    },
    bulkEnroll: async (subjectId, studentIds) => {
        const response = await api.post(`${ADMIN_API.ENROLLMENTS}bulk-enroll/`, {
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
