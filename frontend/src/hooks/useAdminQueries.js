import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import batchService from '../services/batchService';
import departmentService from '../services/departmentService';
import studentService from '../services/studentService';

// --- BATCHES ---
export const useBatches = () => {
    return useQuery({
        queryKey: ['batches'],
        queryFn: async () => {
            const data = await batchService.getAll({ page_size: 1000 });
            return Array.isArray(data) ? data : data?.results || [];
        }
    });
};

export const useCreateBatch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (batchData) => batchService.create(batchData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
        }
    });
};

// --- DEPARTMENTS ---
export const useDepartmentsByBatch = (batchId) => {
    return useQuery({
        queryKey: ['departments', batchId],
        queryFn: async () => {
            const data = await departmentService.getByBatch(batchId, { page_size: 1000 });
            return Array.isArray(data) ? data : data?.results || [];
        },
        enabled: !!batchId
    });
};

export const useCreateDepartment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (deptData) => departmentService.create(deptData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['departments', String(variables.batch_id)] });
        }
    });
};

// --- STUDENTS ---
export const useStudentsByBatchAndDept = (batchId, deptId) => {
    return useQuery({
        queryKey: ['students', batchId, deptId],
        queryFn: async () => {
            const data = await studentService.getByBatchAndDept(batchId, deptId, { page_size: 1000 });
            return Array.isArray(data) ? data : data?.results || [];
        },
        enabled: !!batchId && !!deptId
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userData) => adminService.createUser(userData),
        onSuccess: (_, variables) => {
            if (variables.role === 'STUDENT' && variables.batch_id && variables.department_id) {
                queryClient.invalidateQueries({ queryKey: ['students', String(variables.batch_id), String(variables.department_id)] });
            }
            if (variables.role === 'TEACHER') {
                queryClient.invalidateQueries({ queryKey: ['teachers'] });
            }
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
};

export const useBulkImportStudents = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData) => adminService.bulkImportStudents(formData),
        onSuccess: (_, variables) => {
            const batchId = variables.get('batch_id');
            const deptId = variables.get('department_id');
            if (batchId && deptId) {
                queryClient.invalidateQueries({ queryKey: ['students', String(batchId), String(deptId)] });
            } else {
                queryClient.invalidateQueries({ queryKey: ['students'] });
            }
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
};

// --- USERS (General) ---
export const useUsers = (params) => {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => adminService.getUsers(params)
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, userData }) => adminService.updateUser(id, userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
        }
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => adminService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
        }
    });
};
