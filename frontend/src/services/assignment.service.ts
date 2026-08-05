import api from './api';
import type { Page } from './training.service';

/** Résultats détaillés de la validation IA (backend-ai FastAPI) */
export interface ValidationDetails {
  decision?: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW' | string;
  source?: 'WEB_VERIFIED' | 'TEXT_ONLY' | 'NONE' | string;
  scores?: {
    name_score: number;    // Fuzzy match sur le nom du collaborateur
    title_score: number;   // Comparaison stricte du titre de certification
    date_score: number;    // Comparaison exacte avec completedAt
    overall_score: number;
  };
  reasons?: string[];
  extracted?: {
    holder_name?: string;
    certification_title?: string;
    issue_date?: string;
    issuer?: string;
  };
}

export interface AssignmentResponse {
  id: string;
  itemType: 'CERTIFICATION' | 'TRAINING' | string;
  itemId: string;
  itemName?: string;
  itemCode?: string;
  provider?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  squadName?: string;
  managerId?: string;
  managerName?: string;
  assignedById?: string;
  assignedByName?: string;
  assignedByRole?: string;
  statusCertification?: string;
  statusTraining?: string;
  priority?: string;
  assignedAt?: string;
  completedAt?: string;
  plannedStartDate?: string;
  examAt?: string;
  targetDate?: string;
  isNearDeadline?: boolean;
  trainingProgressPercentage?: number;
  notes?: string;
  certificateId?: string;
  certificateFileName?: string;
  certificateStatus?: string;
  /** Résultats de la validation IA stockés en JSONB */
  validationDetails?: ValidationDetails;
}

export interface AssignmentCreateRequest {
  itemType: 'CERTIFICATION' | 'TRAINING';
  itemId: string;
  userId: string;
  targetManagerId?: string;
  priority?: string;
  targetDate?: string;
  notes?: string;
}

export interface AssignmentUpdateRequest {
  statusCertification?: string;
  statusTraining?: string;
  trainingProgressPercentage?: number;
  plannedStartDate?: string;
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
  },

  uploadCertificate: async (id: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(`/assignments/${id}/upload-certificate`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  downloadCertificate: async (certificateId: string, fileName?: string): Promise<void> => {
    const response = await api.get(`/certificates/${certificateId}/download`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `certificat-${certificateId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  updateCertificateStatus: async (certificateId: string, status: string): Promise<any> => {
    const response = await api.put(`/certificates/${certificateId}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  getCertificatePreviewUrl: async (certificateId: string): Promise<string> => {
    const response = await api.get(`/certificates/${certificateId}/preview`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    return window.URL.createObjectURL(blob);
  }
};
