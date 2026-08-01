import api from './api';
import type { Page, SquadPriorityDto, SquadShortDto } from './training.service';

export interface CertificationRequest {
  code: string;
  name: string;
  provider?: string;
  difficulty: string;
  priority: string;
  examCostUsd?: number;
  trainingCostUsd?: number;
  validityMonths?: number;
  officialUrl?: string;
  examProviderUrl?: string;
  metadata?: Record<string, any>;
  squads: SquadPriorityDto[];
}

export interface CertificationResponse {
  id: string;
  code: string;
  name: string;
  provider: string;
  difficulty: string;
  priority: string;
  examCostUsd: number;
  trainingCostUsd: number;
  validityMonths: number;
  officialUrl: string;
  examProviderUrl: string;
  metadata: Record<string, any>;
  averageRating?: number;
  associatedSquads: SquadShortDto[];
}

export interface RatingCreateRequest {
  rating: number;
  comment?: string;
  wouldRecommend: boolean;
  materialsQuality?: number;
  difficulty?: number;
  usefulness?: number;
}

export interface RatingResponse {
  userId: string;
  userFullName: string;
  certificationId: string;
  rating: number;
  comment?: string;
  wouldRecommend?: boolean;
  materialsQuality?: number;
  difficulty?: number;
  usefulness?: number;
  squadName?: string;
}

export const certificationService = {
  getAllCertifications: async (params?: {
    provider?: string;
    difficulty?: string;
    priority?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<Page<CertificationResponse>> => {
    const response = await api.get<Page<CertificationResponse>>('/certifications', { params });
    return response.data;
  },

  getCertificationById: async (id: string): Promise<CertificationResponse> => {
    const response = await api.get<CertificationResponse>(`/certifications/${id}`);
    return response.data;
  },

  getCertificationRatings: async (id: string): Promise<Page<RatingResponse>> => {
    const response = await api.get<Page<RatingResponse>>(`/certifications/${id}/ratings`);
    return response.data;
  },

  addRating: async (certId: string, data: RatingCreateRequest): Promise<RatingResponse> => {
    const response = await api.post<RatingResponse>(`/certifications/${certId}/ratings`, data);
    return response.data;
  },

  reportRating: async (certId: string, authorId: string): Promise<void> => {
    await api.post(`/certifications/${certId}/ratings/${authorId}/report`);
  },

  createCertification: async (data: CertificationRequest): Promise<CertificationResponse> => {
    const response = await api.post<CertificationResponse>('/certifications', data);
    return response.data;
  },

  updateCertification: async (id: string, data: CertificationRequest): Promise<CertificationResponse> => {
    const response = await api.put<CertificationResponse>(`/certifications/${id}`, data);
    return response.data;
  },

  deleteCertification: async (id: string): Promise<void> => {
    await api.delete(`/certifications/${id}`);
  },

  getProviders: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/certifications/providers');
    return response.data;
  }
};
