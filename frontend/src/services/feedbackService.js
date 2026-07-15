import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { extractResults } from '../utils/apiHelpers';

export const feedbackService = {
    getFeedbacks: async () => {
        const response = await api.get(ENDPOINTS.FEEDBACK);
        return extractResults(response.data);
    },
    submitFeedback: async (data) => {
        const response = await api.post(ENDPOINTS.FEEDBACK, data);
        return response.data;
    }
};

export default feedbackService;
