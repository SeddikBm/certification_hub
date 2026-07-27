import api from './api';
import type { Page } from './training.service';

export interface AssignmentResponse {
  id: string;
  itemType: 'CERTIFICATION' | 'TRAINING' | string;
  itemId: string;
  itemName?: string;
  provider?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  squadName?: string;
  managerName?: string;
  assignedById?: string;
  statusCertification?: string;
  statusTraining?: string;
  priority?: string;
  assignedAt?: string;
  completedAt?: string;
  examAt?: string;
  trainingProgressPercentage?: number;
  notes?: string;
}

export interface AssignmentCreateRequest {
  itemType: 'CERTIFICATION' | 'TRAINING';
  itemId: string;
  userId: string;
  priority?: string;
  targetDate?: string;
  notes?: string;
}

export interface AssignmentUpdateRequest {
  statusCertification?: string;
  statusTraining?: string;
  trainingProgressPercentage?: number;
  examAt?: string;
  notes?: string;
}

export const assignmentService = {
  getAllAssignments: async (params?: {
    userId?: string;
    itemType?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<Page<AssignmentResponse>> => {
    const response = await api.get<Page<AssignmentResponse>>('/assignments', { params });
    return response.data;
  },

  getMyAssignments: async (params?: {
    itemType?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<Page<AssignmentResponse>> => {
    const response = await api.get<Page<AssignmentResponse>>('/assignments/my', { params });
    return response.data;
  },

  createAssignment: async (data: AssignmentCreateRequest): Promise<AssignmentResponse> => {
    const response = await api.post<AssignmentResponse>('/assignments', data);
    return response.data;
  },

  updateAssignment: async (id: string, data: AssignmentUpdateRequest): Promise<AssignmentResponse> => {
    const response = await api.put<AssignmentResponse>(`/assignments/${id}`, data);
    return response.data;
  }
};
