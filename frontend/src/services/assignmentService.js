import api from "../api/axios";
import { extractResults } from "../utils/apiHelpers";



export const assignmentService = {
    // ---- Teacher Operations ----

    getAssignments: async (subjectId = null) => {
        let url = "/assessments/assignments/";
        if (subjectId) url += `?subject=${subjectId}`;
        const response = await api.get(url);
        return extractResults(response.data);
    },

    createAssignment: async (formData) => {
        // formData contains subject, title, description, due_date, max_marks, file
        const response = await api.post("/assessments/assignments/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    getSubmissionsForAssignment: async (assignmentId) => {
        const response = await api.get(`/assessments/submissions/?assignment=${assignmentId}`);
        return extractResults(response.data);
    },

    gradeSubmission: async (submissionId, marks, remarks) => {
        const response = await api.patch(`/assessments/submissions/${submissionId}/grade/`, {
            marks_obtained: marks,
            remarks: remarks
        });
        return response.data;
    },

    // ---- Student Operations ----

    getMyAssignments: async () => {
        const response = await api.get("/assessments/assignments/");
        return extractResults(response.data);
    },

    getMySubmissions: async () => {
        const response = await api.get("/assessments/submissions/");
        return extractResults(response.data);
    },

    submitAssignment: async (formData) => {
        // formData contains assignment (ID), file
        const response = await api.post("/assessments/submissions/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    }
};

export default assignmentService;
