import { api } from './api';
import type { AuthUser, LoginResponse } from '../types/auth';

export async function signup(email: string, password: string): Promise<{ user: AuthUser }> {
  const response = await api.post<{ user: AuthUser }>('/auth/signup', { email, password });
  return response.data;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}
