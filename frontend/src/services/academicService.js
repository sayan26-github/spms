import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { extractResults } from "../utils/apiHelpers";



// Fallback if ENDPOINTS.SUBJECTS isn't defined yet
const SUBJECTS_URL = ENDPOINTS.SUBJECTS || "/academics/subjects/";

export const academicService = {
    getSubjects: async (params = {}) => {
        const response = await api.get(SUBJECTS_URL, { params: { page_size: 1000, ...params } });
        // Backend might return [ ... ] or { count: ..., results: [ ... ] }
        return extractResults(response.data);
    },

    getEnrolledStudents: async (subjectId) => {
        // Use the by_subject action endpoint which properly filters by subject_id
        const response = await api.get(`/academics/enrollments/by_subject/`, {
            params: { subject_id: subjectId }
        });
        return response.data;
    }
};

export default academicService;
