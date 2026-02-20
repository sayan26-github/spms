import api from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';

export const authService = {
    login: async (registrationNumber, password, collegeCode) => {
        return api.post(ENDPOINTS.LOGIN, {
            registration_number: registrationNumber,
            password,
            college_code: collegeCode,
        });
    },
    getColleges: async () => {
        return api.get(ENDPOINTS.COLLEGES);
    },
    getProfile: async () => {
        return api.get(ENDPOINTS.PROFILE);
    },
    updateProfile: async (data) => {
        return api.patch(ENDPOINTS.PROFILE, data);
    }
};
