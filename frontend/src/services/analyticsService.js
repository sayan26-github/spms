import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export const analyticsService = {
    // Get dashboard stats (aggregated risk counts)
    getDashboardStats: async () => {
        const response = await api.get(`${ENDPOINTS.PREDICTIONS}dashboard_stats/`);
        return response.data;
    },

    // Trigger batch analysis
    runAnalysis: async () => {
        const response = await api.post(`${ENDPOINTS.PREDICTIONS}run_analysis/`);
        return response.data;
    },

    // Get list of predictions
    getPredictions: async () => {
        const response = await api.get(ENDPOINTS.PREDICTIONS);
        return response.data;
    },

    // Get student's own performance insights (prediction + recommendations + features)
    getMyInsights: async () => {
        const response = await api.get(`${ENDPOINTS.PREDICTIONS}my-insights/`);
        return response.data;
    },

    // Get smart subject/elective recommendations
    getSubjectRecommendations: async () => {
        const response = await api.get(`${ENDPOINTS.PREDICTIONS}subject-recommendations/`);
        return response.data;
    },

    // Get teacher specific at-risk analytics and XAI insights
    getTeacherAnalytics: async () => {
        const response = await api.get(`${ENDPOINTS.PREDICTIONS}teacher-analytics/`);
        return response.data;
    }
};

export default analyticsService;
