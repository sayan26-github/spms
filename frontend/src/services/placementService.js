import api from '../api/axios';

/**
 * Helper: DRF paginated endpoints return { count, results }.
 * This extracts the array from paginated or plain responses.
 */
const extractResults = (data) => {
    if (data && Array.isArray(data.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
};

export const placementService = {
    // Companies (paginated)
    getCompanies: () => api.get('/placements/companies/', { params: { page_size: 1000 } })
        .then(res => extractResults(res.data)),
    
    // Jobs (paginated)
    getJobs: () => api.get('/placements/jobs/', { params: { page_size: 1000 } })
        .then(res => extractResults(res.data)),
    
    // Recommendations (custom action, returns plain array)
    getRecommendedJobs: () => api.get('/placements/jobs/recommended/')
        .then(res => res.data),
    
    // Applications (paginated)
    getApplications: () => api.get('/placements/applications/', { params: { page_size: 1000 } })
        .then(res => extractResults(res.data)),
    
    applyToJob: (jobId, resumeFile) => {
        const formData = new FormData();
        formData.append('job_id', jobId);
        if (resumeFile) formData.append('resume', resumeFile);
        return api.post('/placements/applications/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data);
    },
    
    // Analytics (custom action, returns plain object)
    getPlacementProbability: () => api.get('/placements/analytics/my_probability/')
        .then(res => res.data),
    
    // Skills (paginated)
    getSkills: () => api.get('/placements/skills/', { params: { page_size: 1000 } })
        .then(res => extractResults(res.data)),
    
    getMySkills: () => api.get('/placements/student-skills/', { params: { page_size: 1000 } })
        .then(res => extractResults(res.data)),
    
    addSkill: (skillId, proficiency) => api.post('/placements/student-skills/', { skill_id: skillId, proficiency })
        .then(res => res.data),
        
    removeSkill: (studentSkillId) => api.delete(`/placements/student-skills/${studentSkillId}/`)
        .then(res => res.data)
};
