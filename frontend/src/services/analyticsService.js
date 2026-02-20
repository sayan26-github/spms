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
    }
};

export default analyticsService;
