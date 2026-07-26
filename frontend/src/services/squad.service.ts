import api from './api';

export interface Squad {
  id: string;
  name: string;
  description?: string;
  colorHex?: string;
}

export const squadService = {
  getSquads: async (): Promise<Squad[]> => {
    const response = await api.get<Squad[]>('/squads');
    return response.data;
  },
};
