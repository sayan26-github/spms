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
    registerCollege: async (data) => {
        return api.post(ENDPOINTS.REGISTER_COLLEGE, data);
    },
    getProfile: async () => {
        return api.get(ENDPOINTS.PROFILE);
    },
    updateProfile: async (data) => {
        return api.patch(ENDPOINTS.PROFILE, data);
    },
    updateProfileWithFile: async (formData) => {
        return api.patch(ENDPOINTS.PROFILE, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },
    changePassword: async (data) => {
        return api.post(ENDPOINTS.CHANGE_PASSWORD, data);
    }
};
