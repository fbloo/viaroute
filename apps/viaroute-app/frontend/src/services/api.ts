import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from Auth0 (this will be handled by the hook)
    // For now, we'll rely on the component to pass the token
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// Helper function to create authenticated API client
export const createAuthenticatedClient = (getAccessTokenSilently: () => Promise<string>) => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    async (config) => {
      try {
        const token = await getAccessTokenSilently();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('No access token available for request');
        }
      } catch (error) {
        console.error('Error getting access token:', error);
        // Don't block the request, but log the error
        // The backend will return 401 if token is required
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return client;
};

// API functions
export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  tenant_id: string;
  name: string;
  features: string;
  created_at: string;
  updated_at: string;
}

export const tenantsApi = {
  getAll: (client: any) => client.get<Tenant[]>('/tenants'),
  getById: (client: any, id: string) => client.get<Tenant>(`/tenants/${id}`),
  create: (client: any, data: { name: string }) => client.post<Tenant>('/tenants', data),
  update: (client: any, id: string, data: { name?: string }) =>
    client.patch<Tenant>(`/tenants/${id}`, data),
  delete: (client: any, id: string) => client.delete(`/tenants/${id}`),
};

export const usersApi = {
  getAll: (client: any) => client.get<User[]>('/users'),
  getById: (client: any, id: string) => client.get<User>(`/users/${id}`),
  create: (client: any, data: { name: string; email: string }) =>
    client.post<User>('/users', data),
  update: (client: any, id: string, data: { name?: string; email?: string }) =>
    client.patch<User>(`/users/${id}`, data),
  delete: (client: any, id: string) => client.delete(`/users/${id}`),
};

export const plansApi = {
  getAll: (client: any) => client.get<Plan[]>('/plans'),
  getById: (client: any, id: string) => client.get<Plan>(`/plans/${id}`),
  create: (client: any, data: { name: string; features?: string }) =>
    client.post<Plan>('/plans', data),
  update: (client: any, id: string, data: { name?: string; features?: string }) =>
    client.patch<Plan>(`/plans/${id}`, data),
  delete: (client: any, id: string) => client.delete(`/plans/${id}`),
};

export interface AuthCallbackResponse {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  isAdminUser: boolean;
}

export const authApi = {
  callback: (client: any) => client.post<AuthCallbackResponse>('/auth/callback'),
};

export default apiClient;

