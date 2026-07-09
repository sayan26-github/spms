import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import { extractResults } from '../utils/apiHelpers';



export const communicationService = {
    // Get messages (Inbox or Sent)
    getMessages: async (folder = 'inbox') => {
        const response = await api.get(`${ENDPOINTS.MESSAGES}?folder=${folder}`);
        return extractResults(response.data);
    },

    // Get a single message
    getMessage: async (id) => {
        const response = await api.get(`${ENDPOINTS.MESSAGES}${id}/`);
        return response.data;
    },

    // Send a new message
    sendMessage: async (data) => {
        const response = await api.post(ENDPOINTS.MESSAGES, data);
        return response.data;
    },

    // Get potential recipients (users in same college)
    getRecipients: async (role = '') => {
        const url = role ? `${ENDPOINTS.MESSAGES}users/?role=${role}` : `${ENDPOINTS.MESSAGES}users/`;
        const response = await api.get(url);
        return extractResults(response.data);
    }
};
