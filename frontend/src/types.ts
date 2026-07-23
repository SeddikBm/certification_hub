export type UserRole = "ADMIN" | "TRAINING_MANAGER" | "CAREER_MANAGER" | "COLLABORATOR";

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
};

export type Certification = {
  id: string;
  code: string;
  name: string;
  provider: string;
  difficulty: "FOUNDATIONAL" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | string;
  priority: "MANDATORY" | "HIGH" | "NORMAL" | "ADVANCED" | string;
  examCostUsd?: number;
  trainingCostUsd?: number;
  validityMonths?: number;
  officialUrl?: string;
  examProviderUrl?: string;
  averageRating?: number;
  associatedSquads?: SquadShort[];
};

export type Training = {
  id: string;
  title: string;
  type: "UDEMY_BUSINESS" | "INTERNAL" | "EXTERNAL" | "CONFERENCE" | string;
  provider: string;
  priority: "MANDATORY" | "OPTIONAL" | string;
  description?: string;
  language?: string;
  durationHours?: number;
  costUsd?: number;
  url?: string;
  associatedSquads?: SquadShort[];
};

export type SquadShort = {
  id: string;
  name: string;
  priority?: number;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | string;
  phone?: string;
  hireDate?: string;
  squadId?: string;
  squadName?: string;
};

export type Assignment = {
  id: string;
  itemType: "CERTIFICATION" | "TRAINING" | string;
  itemId: string;
  userId: string;
  userName: string;
  assignedById?: string;
  statusCertification?: string;
  statusTraining?: string;
  assignedAt: string;
  completedAt?: string;
  examAt?: string;
  trainingProgressPercentage?: number;
  notes?: string;
};

export type Notification = {
  id: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "ERROR" | string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
};

export type ChartData = {
  label: string;
  value: number;
};

export type DashboardStats = {
  totalCertifications: number;
  totalTrainings: number;
  totalUsers: number;
  totalSquads: number;
  certificationsByProvider: ChartData[];
  certificationsBySquad: ChartData[];
  certificationsByDifficulty: ChartData[];
};

export type HierarchyNode = {
  managerId: string;
  firstName: string;
  lastName: string;
  email: string;
  collaboratorCount: number;
};

export type Collaborator = {
  collaboratorId: string;
  firstName: string;
  lastName: string;
  email: string;
  squadName: string;
};
