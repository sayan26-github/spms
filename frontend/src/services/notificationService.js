import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { extractResults } from '../utils/apiHelpers';

export const notificationService = {
    getNotifications: async () => {
        const response = await api.get(ENDPOINTS.NOTIFICATIONS);
        return extractResults(response.data);
    },
    markRead: async (id) => {
        const response = await api.post(`${ENDPOINTS.NOTIFICATIONS}${id}/mark_read/`);
        return response.data;
    },
    markAllRead: async () => {
        const response = await api.post(`${ENDPOINTS.NOTIFICATIONS}mark_all_read/`);
        return response.data;
    }
};

export default notificationService;
