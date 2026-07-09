import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { extractResults } from "../utils/apiHelpers";



export const assessmentService = {
    // Get assessments for a specific subject
    getAssessments: async (subjectId) => {
        const response = await api.get(`${ENDPOINTS.ASSESSMENTS}?subject=${subjectId}`);
        return extractResults(response.data);
    },

    // Create a new assessment
    createAssessment: async (subjectId, name, maxMarks, date) => {
        const response = await api.post(ENDPOINTS.ASSESSMENTS, {
            subject: subjectId,
            name,
            max_marks: maxMarks,
            date
        });
        return response.data;
    },

    // Get marks sheet (students + marks) - For Teacher
    getMarks: async (assessmentId) => {
        const response = await api.get(`${ENDPOINTS.ASSESSMENTS}${assessmentId}/sheet/`);
        return response.data;
    },

    // Get all marks for the logged-in student
    getAllStudentMarks: async () => {
        const response = await api.get(ENDPOINTS.MARKS);
        return extractResults(response.data);
    },

    // Bulk update marks - For Teacher
    updateMarks: async (assessmentId, marksData) => {
        const response = await api.post(`${ENDPOINTS.MARKS}update-bulk/`, {
            assessment_id: assessmentId,
            marks: marksData,
        });
        return response.data;
    },

    // Get Transcript for a specific student
    getTranscript: async (studentId) => {
        const response = await api.get(`${ENDPOINTS.TRANSCRIPT}${studentId}/`);
        return response.data;
    },

    // Get Transcript for the currently logged-in student
    getMyTranscript: async () => {
        const response = await api.get(`${ENDPOINTS.TRANSCRIPT}me/`);
        return response.data;
    },
};

export default assessmentService;
