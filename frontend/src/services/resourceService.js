import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

export const resourceService = {
    // Get resources for a subject (Teachers & Students)
    getResourcesBySubject: async (subjectId) => {
        const response = await api.get(`${ENDPOINTS.RESOURCES}?subject=${subjectId}`);
        return response.data;
    },

    // Upload a resource (Teachers only)
    uploadResource: async (formData) => {
        const response = await api.post(ENDPOINTS.RESOURCES, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Delete a resource (Teachers only)
    deleteResource: async (id) => {
        await api.delete(`${ENDPOINTS.RESOURCES}${id}/`);
    }
};
