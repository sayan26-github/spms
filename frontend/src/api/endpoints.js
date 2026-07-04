export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export const ENDPOINTS = {
    LOGIN: "/auth/login/",
    COLLEGES: "/auth/colleges/",
    REGISTER_COLLEGE: "/auth/register-college/",
    REFRESH: "/auth/token/refresh/",
    PROFILE: "/auth/profile/",
    ADMINS: "/auth/admins/",

    // Dashboard Metrics
    ANALYTICS_DASHBOARD_STATS: "/analytics/predictions/dashboard-stats/",
    ACADEMICS_DASHBOARD_STATS: "/academics/dashboard-stats/",

    // Attendance
    ATTENDANCE: "/attendance/records/",
    SESSIONS: "/attendance/sessions/",

    // Assessments
    ASSESSMENTS: "/assessments/tests/",
    MARKS: "/assessments/marks/",
    TRANSCRIPT: "/assessments/transcript/",

    // Academics
    SUBJECTS: "/academics/subjects/",

    // Analytics
    PREDICTIONS: "/analytics/predictions/",
    MY_INSIGHTS: '/analytics/predictions/my-insights/',
    SUBJECT_RECOMMENDATIONS: '/analytics/predictions/subject-recommendations/',
    CHAT: '/analytics/predictions/chat/',

    // Communication
    MESSAGES: "/communication/messages/",
    RESOURCES: '/academics/resources/',
};
