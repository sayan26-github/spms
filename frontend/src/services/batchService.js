import api from '../api/axios';
import { extractResults } from '../utils/apiHelpers';

const BATCH_API = '/academics/batches/';

export const batchService = {
    getAll: async (params = {}) => {
        const response = await api.get(BATCH_API, { params });
        return extractResults(response.data);
    },
    create: async (data) => {
        const response = await api.post(BATCH_API, data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`${BATCH_API}${id}/`, data);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`${BATCH_API}${id}/`);
    }
};

export default batchService;
