import axios from 'axios';
import { showGlobalToast } from '../hooks/useToast';
import { triggerGlobalLogout } from '../hooks/useAuth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Login/signup surface their own inline errors (wrong password, duplicate
// email) and a 401 from a login attempt isn't a session expiry — it's a
// credentials error, so it's excluded from the global redirect/toast below.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/signup'];

function isAuthEndpoint(url?: string): boolean {
  return url !== undefined && AUTH_ENDPOINTS.some((path) => url.includes(path));
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url;

      if (status === 401 && !isAuthEndpoint(url)) {
        showGlobalToast('Your session has expired. Please log in again.');
        triggerGlobalLogout();
        return Promise.reject(error);
      }

      if (!isAuthEndpoint(url)) {
        if (error.response) {
          const data: unknown = error.response.data;
          const message =
            typeof data === 'object' && data !== null && typeof (data as { error?: unknown }).error === 'string'
              ? (data as { error: string }).error
              : 'Something went wrong. Please try again.';
          showGlobalToast(message);
        } else {
          showGlobalToast('Network error. Please check your connection.');
        }
      }
    }
    return Promise.reject(error);
  },
);
