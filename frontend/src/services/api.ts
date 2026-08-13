import { Form, FormCreate, Response } from '@/types/form';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  // Try to get session if we are in client environment
  let token = '';
  try {
    const session: any = await getSession();
    if (session?.backendToken) {
      token = session.backendToken;
    }
  } catch (e) {
    // Ignore error, might be server-side or no session
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const formsService = {
  getForms: (): Promise<Form[]> => fetchApi('/forms/'),
  
  getForm: (id: number): Promise<Form> => fetchApi(`/forms/${id}`),
  
  createForm: (form: FormCreate): Promise<Form> => 
    fetchApi('/forms/', {
      method: 'POST',
      body: JSON.stringify(form),
    }),
    
  updateForm: (id: number, form: FormCreate): Promise<Form> => 
    fetchApi(`/forms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    }),
    
  deleteForm: (id: number): Promise<void> => 
    fetchApi(`/forms/${id}`, {
      method: 'DELETE',
    }),
    
  duplicateForm: (id: number): Promise<Form> => 
    fetchApi(`/forms/${id}/duplicate`, {
      method: 'POST',
    }),
    
  getResponses: (formId: number): Promise<Response[]> => 
    fetchApi(`/forms/${formId}/responses`),
    
  submitResponse: (formId: number, data: any): Promise<any> =>
    fetchApi(`/forms/${formId}/responses`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
};
