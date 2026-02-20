import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

// Fallback if ENDPOINTS.SUBJECTS isn't defined yet
const SUBJECTS_URL = ENDPOINTS.SUBJECTS || "/academics/subjects/";

export const academicService = {
    getSubjects: async () => {
        const response = await api.get(SUBJECTS_URL);
        // Backend might return [ ... ] or { count: ..., results: [ ... ] }
        return response.data;
    },

    getEnrolledStudents: async (subjectId) => {
        // We might need a custom endpoint or filter enrollments
        // For now, let's assume we can get students via enrollments endpoint if needed
        // or maybe the subject detail has them.
        // Actually, for attendance, we usually fetch students via the session or just a list of enrolled.
        // Let's rely on the attendance service to handle session-based student fetching.
        // But if we need raw student list:
        const response = await api.get(`/academics/enrollments/?subject=${subjectId}`);
        return response.data;
    }
};

export default academicService;
