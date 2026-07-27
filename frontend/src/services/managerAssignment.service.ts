import api from './api';
import type { Page } from './training.service';

export interface CareerManagerHierarchyResponse {
  managerId: string;
  firstName: string;
  lastName: string;
  email: string;
  collaboratorCount: number;
}

export interface AssignedCollaboratorResponse {
  collaboratorId: string;
  firstName: string;
  lastName: string;
  email: string;
  squadName?: string;
}

export interface ManagerAssignmentRequest {
  managerId: string;
  collaboratorId: string;
}

export interface ManagerAssignmentResponse {
  managerId: string;
  collaboratorId: string;
  assignedAt: string;
}

export const managerAssignmentService = {
  getHierarchyOverview: async (params?: {
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<Page<CareerManagerHierarchyResponse>> => {
    const response = await api.get<Page<CareerManagerHierarchyResponse>>('/manager-assignments/hierarchy', { params });
    return response.data;
  },

  getAssignedCollaborators: async (managerId: string): Promise<AssignedCollaboratorResponse[]> => {
    const response = await api.get<AssignedCollaboratorResponse[]>(`/manager-assignments/${managerId}/collaborators`);
    return response.data;
  },

  assignManager: async (data: ManagerAssignmentRequest): Promise<ManagerAssignmentResponse> => {
    const response = await api.post<ManagerAssignmentResponse>('/manager-assignments', data);
    return response.data;
  },

  removeAssignment: async (managerId: string, collaboratorId: string): Promise<void> => {
    await api.delete(`/manager-assignments/${managerId}/${collaboratorId}`);
  }
};
