export const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export const ENDPOINTS = {
    LOGIN: "/auth/login/",
    COLLEGES: "/auth/colleges/",
    REFRESH: "/auth/token/refresh/",
    PROFILE: "/auth/profile/",
    ADMINS: "/auth/admins/",

    // Dashboard Metrics
    DASHBOARD_STATS: "/analytics/dashboard-stats/",

    // Attendance
    ATTENDANCE: "/attendance/attendance/",
    SESSIONS: "/attendance/sessions/",

    // Assessments
    ASSESSMENTS: "/assessments/tests/",
    MARKS: "/assessments/marks/",

    // Academics
    SUBJECTS: "/academics/subjects/",

    // Analytics
    PREDICTIONS: "/analytics/predictions/",

    // Communication
    MESSAGES: "/communication/messages/",
    RECIPIENTS: '/communication/messages/recipients/',
    RESOURCES: '/academics/resources/',
};
