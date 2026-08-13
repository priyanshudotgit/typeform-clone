import { useQuery } from '@tanstack/react-query';
import { formsService } from '@/services/api';

export const useFormResponses = (formId: number) => {
  return useQuery({
    queryKey: ['forms', formId, 'responses'],
    queryFn: () => formsService.getResponses(formId),
    enabled: !!formId,
  });
};
