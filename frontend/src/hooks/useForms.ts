import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formsService } from '@/services/api';
import { FormCreate } from '@/types/form';

export const useForms = () => {
  return useQuery({
    queryKey: ['forms'],
    queryFn: formsService.getForms,
  });
};

export const useForm = (id: number) => {
  return useQuery({
    queryKey: ['forms', id],
    queryFn: () => formsService.getForm(id),
    enabled: !!id,
  });
};

export const useCreateForm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newForm: FormCreate) => formsService.createForm(newForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
};

export const useUpdateForm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormCreate }) => formsService.updateForm(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      queryClient.invalidateQueries({ queryKey: ['forms', variables.id] });
    },
  });
};

export const useDeleteForm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => formsService.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
};

export const useDuplicateForm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => formsService.duplicateForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
};
