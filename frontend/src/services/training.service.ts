import api from './api';

export interface SquadPriorityDto {
  squadId: string;
  priority: number;
}

export interface TrainingRequest {
  title: string;
  type: string;
  provider?: string;
  priority: string;
  description?: string;
  language?: string;
  durationHours?: number;
  costUsd?: number;
  url?: string;
  metadata?: Record<string, any>;
  squads: SquadPriorityDto[];
}

export interface SquadShortDto {
  id: string;
  name: string;
  priority: number;
}

export interface TrainingResponse {
  id: string;
  title: string;
  type: string;
  provider: string;
  priority: string;
  description: string;
  language: string;
  durationHours: number;
  costUsd: number;
  url: string;
  metadata: Record<string, any>;
  associatedSquads: SquadShortDto[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const trainingService = {
  getAllTrainings: async (params?: {
    provider?: string;
    type?: string;
    priority?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<Page<TrainingResponse>> => {
    const response = await api.get<Page<TrainingResponse>>('/trainings', { params });
    return response.data;
  },

  getTrainingById: async (id: string): Promise<TrainingResponse> => {
    const response = await api.get<TrainingResponse>(`/trainings/${id}`);
    return response.data;
  },

  createTraining: async (data: TrainingRequest): Promise<TrainingResponse> => {
    const response = await api.post<TrainingResponse>('/trainings', data);
    return response.data;
  },

  updateTraining: async (id: string, data: TrainingRequest): Promise<TrainingResponse> => {
    const response = await api.put<TrainingResponse>(`/trainings/${id}`, data);
    return response.data;
  },

  deleteTraining: async (id: string): Promise<void> => {
    await api.delete(`/trainings/${id}`);
  }
};
