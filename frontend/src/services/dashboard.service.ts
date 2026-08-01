import api from './api';

export interface ChartDataResponse {
  label: string;
  value: number;
  certificationsCount?: number;
  trainingsCount?: number;
}

export interface DashboardStatsResponse {
  totalCertifications: number;
  totalTrainings: number;
  totalUsers: number;
  totalSquads: number;
  totalAssignments?: number;
  completedAssignments?: number;
  pendingAssignments?: number;
  scopeName?: string;
  
  certificationsByProvider: ChartDataResponse[];
  certificationsBySquad: ChartDataResponse[];
  certificationsByDifficulty: ChartDataResponse[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    const response = await api.get<DashboardStatsResponse>('/dashboard/stats');
    return response.data;
  }
};
