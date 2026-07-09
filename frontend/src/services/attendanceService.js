import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { extractResults } from "../utils/apiHelpers";



export const attendanceService = {
    // Get sessions for a specific subject
    getSessions: async (subjectId) => {
        const response = await api.get(`${ENDPOINTS.SESSIONS}?subject=${subjectId}`);
        return extractResults(response.data);
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
            ? `${ENDPOINTS.ATTENDANCE}?session_id=${sessionId}`
            : ENDPOINTS.ATTENDANCE;
        const response = await api.get(url);
        return extractResults(response.data);
    },

    // Mark/Update attendance (BulK)
    // Expects: { session_id: 1, attendance_data: [{student_id: 1, status: 'PRESENT'}, ...] }
    updateAttendance: async (sessionId, attendanceData) => {
        const response = await api.post(`${ENDPOINTS.ATTENDANCE}update-bulk/`, {
            session_id: sessionId,
            attendance: attendanceData,
        });
        return response.data;
    },
};

export default attendanceService;
