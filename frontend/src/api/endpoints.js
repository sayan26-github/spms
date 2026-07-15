export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export const ENDPOINTS = {
    LOGIN: "/auth/login/",
    COLLEGES: "/auth/colleges/",
    REGISTER_COLLEGE: "/auth/register-college/",
    REFRESH: "/auth/token/refresh/",
    PROFILE: "/auth/profile/",
    ADMINS: "/auth/admins/",
    CHANGE_PASSWORD: "/auth/change-password/",

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
    ASSIGNMENTS: "/assessments/assignments/",
    SUBMISSIONS: "/assessments/submissions/",

    // Academics
    SUBJECTS: "/academics/subjects/",
    BATCHES: "/academics/batches/",
    DEPARTMENTS: "/academics/departments/",
    STUDENTS: "/academics/students/",
    TEACHERS: "/academics/teachers/",

    // Analytics
    PREDICTIONS: "/analytics/predictions/",
    MY_INSIGHTS: '/analytics/predictions/my-insights/',
    SUBJECT_RECOMMENDATIONS: '/analytics/predictions/subject-recommendations/',
    CHAT: '/analytics/predictions/chat/',

    // Communication
    MESSAGES: "/communication/messages/",
    NOTIFICATIONS: "/communication/notifications/",
    FEEDBACK: "/communication/feedback/",
    RESOURCES: '/academics/resources/',

    // Placements
    COMPANIES: "/placements/companies/",
    JOBS: "/placements/jobs/",
    RECOMMENDED_JOBS: "/placements/jobs/recommended/",
    APPLICATIONS: "/placements/applications/",
    PLACEMENT_ANALYTICS: "/placements/analytics/my_probability/",
    SKILLS: "/placements/skills/",
    STUDENT_SKILLS: "/placements/student-skills/",
};
