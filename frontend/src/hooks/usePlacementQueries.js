import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { placementService } from '../services/placementService';

// --- ADMIN PLACEMENTS ---
export const useJobs = () => {
    return useQuery({
        queryKey: ['jobs'],
        queryFn: async () => {
            const data = await placementService.getJobs();
            return Array.isArray(data) ? data : data?.results || [];
        }
    });
};

export const useCompanies = () => {
    return useQuery({
        queryKey: ['companies'],
        queryFn: async () => {
            const data = await placementService.getCompanies();
            return Array.isArray(data) ? data : data?.results || [];
        }
    });
};

export const useApplications = () => {
    return useQuery({
        queryKey: ['applications'],
        queryFn: async () => {
            const data = await placementService.getApplications();
            return Array.isArray(data) ? data : data?.results || [];
        }
    });
};

export const useCreateJob = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (jobData) => placementService.createJob(jobData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
        }
    });
};

export const useCreateCompany = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (companyData) => placementService.createCompany(companyData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
        }
    });
};

// --- STUDENT PROFILE / SKILLS ---
export const useSkills = () => {
    return useQuery({
        queryKey: ['skills'],
        queryFn: async () => {
            const data = await placementService.getSkills();
            return Array.isArray(data) ? data : data?.results || [];
        }
    });
};

export const useMySkills = () => {
    return useQuery({
        queryKey: ['mySkills'],
        queryFn: async () => {
            const data = await placementService.getMySkills();
            return Array.isArray(data) ? data : data?.results || [];
        }
    });
};

export const useAddSkill = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ skillId, proficiency }) => placementService.addSkill(skillId, proficiency),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mySkills'] });
        }
    });
};

export const useRemoveSkill = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (studentSkillId) => placementService.removeSkill(studentSkillId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mySkills'] });
        }
    });
};
