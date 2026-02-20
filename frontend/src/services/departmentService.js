import api from '../api/axios';

const DEPT_API = '/academics/departments/';

export const departmentService = {
    getAll: async () => {
        const response = await api.get(DEPT_API);
        return response.data;
    },
    getByBatch: async (batchId) => {
        const response = await api.get(DEPT_API, { params: { batch: batchId } });
        return response.data;
    },
    create: async (data) => {
        const response = await api.post(DEPT_API, data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.patch(`${DEPT_API}${id}/`, data);
        return response.data;
    },
    delete: async (id) => {
        await api.delete(`${DEPT_API}${id}/`);
    }
};

export default departmentService;
