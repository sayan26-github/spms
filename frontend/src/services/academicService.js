import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

/**
 * Helper: DRF paginated endpoints return { count, results }.
 * This extracts the array from paginated or plain responses.
 */
const extractResults = (data) => {
    if (data && Array.isArray(data.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
};

// Fallback if ENDPOINTS.SUBJECTS isn't defined yet
const SUBJECTS_URL = ENDPOINTS.SUBJECTS || "/academics/subjects/";

export const academicService = {
    getSubjects: async () => {
        const response = await api.get(SUBJECTS_URL);
        // Backend might return [ ... ] or { count: ..., results: [ ... ] }
        return extractResults(response.data);
    },

    getEnrolledStudents: async (subjectId) => {
        // Use the by-subject action endpoint which properly filters by subject_id
        const response = await api.get(`/academics/enrollments/by-subject/`, {
            params: { subject_id: subjectId }
        });
        return response.data;
    }
};

export default academicService;
