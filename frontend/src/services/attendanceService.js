import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const attendanceService = {
    // Get sessions for a specific subject
    getSessions: async (subjectId) => {
        const response = await api.get(`${ENDPOINTS.SESSIONS}?subject=${subjectId}`);
        return response.data;
    },

    // Create a new class session
    createSession: async (subjectId, date, topic) => {
        const response = await api.post(ENDPOINTS.SESSIONS, {
            subject: subjectId,
            date,
            topic,
        });
        return response.data;
    },

    // Get attendance records
    // If sessionId is provided, fetch for that session (Teacher view)
    // If no sessionId, fetch all for user (Student view)
    getAttendance: async (sessionId) => {
        const url = sessionId
            ? `${ENDPOINTS.ATTENDANCE}?class_session=${sessionId}`
            : ENDPOINTS.ATTENDANCE;
        const response = await api.get(url);
        return response.data;
    },

    // Mark/Update attendance (BulK)
    // Expects: { session_id: 1, attendance_data: [{student_id: 1, status: 'PRESENT'}, ...] }
    updateAttendance: async (sessionId, attendanceData) => {
        const response = await api.post(`${ENDPOINTS.ATTENDANCE}update-bulk/`, { // Fixed URL
            session_id: sessionId,
            attendance: attendanceData, // Backend expects 'attendance', not 'attendance_data' based on previous context check
        });
        return response.data;
    },
};

export default attendanceService;
