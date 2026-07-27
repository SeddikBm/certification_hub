import api from './api';
import type { Page } from './training.service';

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  phone?: string;
  hireDate?: string;
  squadId?: string;
  squadName?: string;
}

export interface UserCreateRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
  squadId?: string;
  phone?: string;
  hireDate?: string;
}

export interface UserUpdateRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
  squadId?: string;
  phone?: string;
  hireDate?: string;
}

export const userService = {
  getUsers: async (params?: {
    role?: string;
    squadId?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<Page<UserResponse>> => {
    const response = await api.get<Page<UserResponse>>('/users', { params });
    return response.data;
  },

  createUser: async (data: UserCreateRequest): Promise<UserResponse> => {
    const response = await api.post<UserResponse>('/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: UserUpdateRequest): Promise<UserResponse> => {
    const response = await api.put<UserResponse>(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};
