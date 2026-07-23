import {
  demoAssignments,
  demoCertifications,
  demoDashboard,
  demoHierarchy,
  demoNotifications,
  demoTrainings,
  demoUsers,
  demoUser
} from "../data/mockData";
import type {
  Assignment,
  AuthResponse,
  Certification,
  DashboardStats,
  HierarchyNode,
  Notification,
  Page,
  Training,
  User
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

const pageOf = <T>(content: T[]): Page<T> => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  number: 0,
  size: content.length
});

const tokenStore = {
  get accessToken() {
    return localStorage.getItem("certificationHub.accessToken");
  },
  get refreshToken() {
    return localStorage.getItem("certificationHub.refreshToken");
  },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem("certificationHub.accessToken", accessToken);
    localStorage.setItem("certificationHub.refreshToken", refreshToken);
  },
  clear() {
    localStorage.removeItem("certificationHub.accessToken");
    localStorage.removeItem("certificationHub.refreshToken");
    localStorage.removeItem("certificationHub.user");
  }
};

const buildQuery = (params?: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  const isForm = options.body instanceof FormData;

  if (!isForm) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false && tokenStore.accessToken) {
    headers.set("Authorization", `Bearer ${tokenStore.accessToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await request<AuthResponse>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password })
      });
      tokenStore.set(response.accessToken, response.refreshToken);
      if (response.user) {
        localStorage.setItem("certificationHub.user", JSON.stringify(response.user));
      }
      return response;
    } catch {
      const response = {
        accessToken: "demo-access-token",
        refreshToken: "demo-refresh-token",
        user: { ...demoUser, email: email || demoUser.email }
      };
      tokenStore.set(response.accessToken, response.refreshToken);
      localStorage.setItem("certificationHub.user", JSON.stringify(response.user));
      return response;
    }
  },
  async logout() {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } finally {
      tokenStore.clear();
    }
  }
};

export const hubApi = {
  async dashboard(): Promise<DashboardStats> {
    try {
      return await request<DashboardStats>("/dashboard/stats");
    } catch {
      return demoDashboard;
    }
  },
  async certifications(params?: Record<string, string | number | undefined>): Promise<Page<Certification>> {
    try {
      return await request<Page<Certification>>(`/certifications${buildQuery(params)}`);
    } catch {
      return pageOf(demoCertifications);
    }
  },
  async saveCertification(payload: Partial<Certification>) {
    const { associatedSquads, averageRating, ...requestPayload } = payload;
    const squads = associatedSquads?.map((squad) => ({ squadId: squad.id, priority: squad.priority ?? 1 })) ?? [];
    const body = JSON.stringify({ ...requestPayload, squads });
    if (payload.id && !payload.id.startsWith("c")) {
      return request<Certification>(`/certifications/${payload.id}`, { method: "PUT", body });
    }
    return request<Certification>("/certifications", { method: "POST", body });
  },
  async deleteCertification(id: string) {
    if (id.startsWith("c")) {
      return;
    }
    await request<void>(`/certifications/${id}`, { method: "DELETE" });
  },
  async trainings(params?: Record<string, string | number | undefined>): Promise<Page<Training>> {
    try {
      return await request<Page<Training>>(`/trainings${buildQuery(params)}`);
    } catch {
      return pageOf(demoTrainings);
    }
  },
  async saveTraining(payload: Partial<Training>) {
    const { associatedSquads, ...requestPayload } = payload;
    const squads = associatedSquads?.map((squad) => ({ squadId: squad.id, priority: squad.priority ?? 1 })) ?? [];
    const body = JSON.stringify({ ...requestPayload, squads });
    if (payload.id && !payload.id.startsWith("t")) {
      return request<Training>(`/trainings/${payload.id}`, { method: "PUT", body });
    }
    return request<Training>("/trainings", { method: "POST", body });
  },
  async deleteTraining(id: string) {
    if (id.startsWith("t")) {
      return;
    }
    await request<void>(`/trainings/${id}`, { method: "DELETE" });
  },
  async users(params?: Record<string, string | number | undefined>): Promise<Page<User>> {
    try {
      return await request<Page<User>>(`/users${buildQuery(params)}`);
    } catch {
      return pageOf(demoUsers);
    }
  },
  async createUser(payload: Partial<User> & { password?: string }) {
    return request<User>("/users", { method: "POST", body: JSON.stringify(payload) });
  },
  async assignments(params?: Record<string, string | number | undefined>): Promise<Page<Assignment>> {
    try {
      return await request<Page<Assignment>>(`/assignments${buildQuery(params)}`);
    } catch {
      return pageOf(demoAssignments);
    }
  },
  async createAssignment(payload: Partial<Assignment>) {
    return request<Assignment>("/assignments", { method: "POST", body: JSON.stringify(payload) });
  },
  async updateAssignment(id: string, payload: Partial<Assignment>) {
    return request<Assignment>(`/assignments/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  async uploadCertificate(assignmentId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    await request<void>(`/assignments/${assignmentId}/upload-certificate`, { method: "POST", body });
  },
  async hierarchy(): Promise<Page<HierarchyNode>> {
    try {
      return await request<Page<HierarchyNode>>("/manager-assignments/hierarchy");
    } catch {
      return pageOf(demoHierarchy);
    }
  },
  async notifications(): Promise<Notification[]> {
    try {
      return await request<Notification[]>("/notifications");
    } catch {
      return demoNotifications;
    }
  },
  async markNotificationRead(id: string) {
    if (id.startsWith("n")) {
      return;
    }
    await request<void>(`/notifications/${id}/read`, { method: "PUT" });
  }
};

export const getStoredUser = () => {
  const value = localStorage.getItem("certificationHub.user");
  return value ? JSON.parse(value) : null;
};
