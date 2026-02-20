import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const assessmentService = {
    // Get assessments for a specific subject
    getAssessments: async (subjectId) => {
        const response = await api.get(`${ENDPOINTS.ASSESSMENTS}?subject=${subjectId}`);
        return response.data;
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
        return response.data;
    },

    // Bulk update marks - For Teacher
    updateMarks: async (assessmentId, marksData) => {
        const response = await api.post(`${ENDPOINTS.MARKS}update-bulk/`, {
            assessment_id: assessmentId,
            marks: marksData,
        });
        return response.data;
    },
};

export default assessmentService;
