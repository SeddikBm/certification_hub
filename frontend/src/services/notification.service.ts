import api from './api';

export interface NotificationResponse {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export const notificationService = {
  // GET /api/v1/notifications
  getMyNotifications: async (): Promise<NotificationResponse[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // PUT /api/v1/notifications/:id/read
  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },

  // PUT /api/v1/notifications/read-all
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  }
};
