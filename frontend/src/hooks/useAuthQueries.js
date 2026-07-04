import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';

export const useProfile = (enabled = true) => {
    return useQuery({
        queryKey: ['authProfile'],
        queryFn: async () => {
            const response = await authService.getProfile();
            return response.data;
        },
        enabled
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData) => authService.updateProfileWithFile(formData),
        onSuccess: (res) => {
            queryClient.setQueryData(['authProfile'], (oldData) => ({
                ...oldData,
                ...res.data
            }));
            queryClient.invalidateQueries({ queryKey: ['authProfile'] });
        }
    });
};
