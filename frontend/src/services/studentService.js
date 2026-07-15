import api from '../api/axios';
import { extractResults } from '../utils/apiHelpers';

const STUDENT_API = '/academics/students/';

export const studentService = {
    getByBatchAndDept: async (batchId, deptId, additionalParams = {}) => {
        const response = await api.get(STUDENT_API, {
            params: { batch: batchId, department: deptId, ...additionalParams }
        });
        return extractResults(response.data);
    },
    create: async (data) => {
        const response = await api.post(STUDENT_API, data);
        return response.data;
    }
};

export default studentService;
