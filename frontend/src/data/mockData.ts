import type {
  Assignment,
  AuthUser,
  Certification,
  DashboardStats,
  HierarchyNode,
  Notification,
  Training,
  User
} from "../types";

export const appText = {
  productName: "Certification Hub",
  brandName: "Devoteam",
  loginTitle: "Certification Hub",
  loginSubtitle: "Plan, assign, track, and prove certification progress across squads.",
  demoHint: "Demo mode is available when the backend is offline.",
  searchPlaceholder: "Search by name, provider, squad, or owner",
  emptyTitle: "Nothing to show yet",
  emptyDescription: "Try changing the filters or syncing with the backend.",
  loading: "Loading workspace",
  offline: "Demo data shown because the API is not reachable.",
  actions: {
    add: "Add",
    assign: "Assign",
    cancel: "Cancel",
    close: "Close",
    create: "Create",
    delete: "Delete",
    edit: "Edit",
    login: "Sign in",
    logout: "Sign out",
    markRead: "Mark read",
    save: "Save",
    upload: "Upload proof",
    view: "View"
  }
};

export const navItems = [
  { label: "Dashboard", path: "/", icon: "LayoutDashboard" },
  { label: "Certifications", path: "/certifications", icon: "Award" },
  { label: "Trainings", path: "/trainings", icon: "BookOpen" },
  { label: "Assignments", path: "/assignments", icon: "ClipboardCheck" },
  { label: "Users", path: "/users", icon: "Users" },
  { label: "Hierarchy", path: "/hierarchy", icon: "GitBranch" },
  { label: "Notifications", path: "/notifications", icon: "Bell" }
] as const;

export const pageCopy = {
  dashboard: {
    title: "Operations dashboard",
    eyebrow: "Certification readiness",
    description: "A consolidated view of catalogue depth, active people, squads, and provider coverage.",
    chartProvider: "Certifications by provider",
    chartDifficulty: "Difficulty mix",
    chartSquad: "Squad coverage"
  },
  certifications: {
    title: "Certification catalogue",
    description: "Browse, filter, create, edit, and retire certifications from one professional workspace."
  },
  trainings: {
    title: "Training catalogue",
    description: "Manage non-certifying learning paths with the same governance pattern as certifications."
  },
  assignments: {
    title: "Assignments",
    description: "Track collaborator progress, update status, and upload completion evidence."
  },
  users: {
    title: "Users",
    description: "Administer collaborators, managers, squads, roles, and account status."
  },
  hierarchy: {
    title: "Career manager hierarchy",
    description: "Visualize manager ownership and collaborator coverage."
  },
  notifications: {
    title: "Notifications",
    description: "Review in-app alerts created by assignment, deadline, and certificate events."
  }
};

export const roleOptions = ["ADMIN", "TRAINING_MANAGER", "CAREER_MANAGER", "COLLABORATOR"] as const;
export const certificationPriorityOptions = ["MANDATORY", "HIGH", "NORMAL", "ADVANCED"] as const;
export const trainingPriorityOptions = ["MANDATORY", "OPTIONAL"] as const;
export const difficultyOptions = ["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
export const trainingTypeOptions = ["UDEMY_BUSINESS", "INTERNAL", "EXTERNAL", "CONFERENCE"] as const;
export const assignmentStatusOptions = ["PENDING_APPROVAL", "APPROVED", "PLANNED", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"] as const;

export const demoUser: AuthUser = {
  id: "7df76621-77f1-4eb2-9549-32054b61b711",
  email: "admin@devoteam.com",
  role: "ADMIN",
  firstName: "Nora",
  lastName: "Admin"
};

export const demoCertifications: Certification[] = [
  {
    id: "c1",
    code: "AWS-SAA",
    name: "AWS Certified Solutions Architect Associate",
    provider: "Amazon Web Services",
    difficulty: "INTERMEDIATE",
    priority: "MANDATORY",
    examCostUsd: 150,
    trainingCostUsd: 600,
    validityMonths: 36,
    officialUrl: "https://aws.amazon.com/certification/",
    averageRating: 4.7,
    associatedSquads: [{ id: "s1", name: "Cloud Platform", priority: 1 }]
  },
  {
    id: "c2",
    code: "AZ-305",
    name: "Microsoft Azure Solutions Architect Expert",
    provider: "Microsoft",
    difficulty: "EXPERT",
    priority: "MANDATORY",
    examCostUsd: 165,
    trainingCostUsd: 800,
    validityMonths: 12,
    officialUrl: "https://learn.microsoft.com/certifications/",
    averageRating: 4.5,
    associatedSquads: [{ id: "s2", name: "Data & AI", priority: 2 }]
  },
  {
    id: "c3",
    code: "PCD",
    name: "Professional Cloud Developer",
    provider: "Google Cloud",
    difficulty: "ADVANCED",
    priority: "HIGH",
    examCostUsd: 200,
    trainingCostUsd: 720,
    validityMonths: 24,
    officialUrl: "https://cloud.google.com/learn/certification",
    averageRating: 4.3,
    associatedSquads: [{ id: "s3", name: "Software Engineering", priority: 2 }]
  },
  {
    id: "c4",
    code: "CKA",
    name: "Certified Kubernetes Administrator",
    provider: "Linux Foundation",
    difficulty: "ADVANCED",
    priority: "HIGH",
    examCostUsd: 395,
    trainingCostUsd: 450,
    validityMonths: 36,
    officialUrl: "https://training.linuxfoundation.org/certification/",
    averageRating: 4.8,
    associatedSquads: [{ id: "s1", name: "Cloud Platform", priority: 1 }]
  }
];

export const demoTrainings: Training[] = [
  {
    id: "t1",
    title: "Cloud Architecture Design Sprint",
    type: "INTERNAL",
    provider: "Devoteam Academy",
    priority: "MANDATORY",
    description: "Hands-on architecture patterns, tradeoffs, and exam preparation.",
    language: "English",
    durationHours: 16,
    costUsd: 350,
    url: "https://devoteam.com",
    associatedSquads: [{ id: "s1", name: "Cloud Platform", priority: 1 }]
  },
  {
    id: "t2",
    title: "Secure Delivery Foundations",
    type: "UDEMY_BUSINESS",
    provider: "Internal",
    priority: "OPTIONAL",
    description: "Security baseline for delivery teams preparing cloud certifications.",
    language: "French",
    durationHours: 8,
    costUsd: 0,
    associatedSquads: [{ id: "s3", name: "Software Engineering", priority: 3 }]
  },
  {
    id: "t3",
    title: "Data Platform Practitioner Bootcamp",
    type: "EXTERNAL",
    provider: "Microsoft Learn",
    priority: "OPTIONAL",
    description: "Data engineering, governance, and Azure certification readiness.",
    language: "English",
    durationHours: 24,
    costUsd: 500,
    associatedSquads: [{ id: "s2", name: "Data & AI", priority: 1 }]
  }
];

export const demoUsers: User[] = [
  {
    id: demoUser.id,
    email: demoUser.email,
    firstName: demoUser.firstName,
    lastName: demoUser.lastName,
    role: demoUser.role,
    status: "ACTIVE",
    phone: "+212 600 000 001",
    hireDate: "2024-02-12",
    squadId: "s0",
    squadName: "Operations"
  },
  {
    id: "u2",
    email: "amine.elidrissi@devoteam.com",
    firstName: "Amine",
    lastName: "El Idrissi",
    role: "CAREER_MANAGER",
    status: "ACTIVE",
    squadId: "s1",
    squadName: "Cloud Platform"
  },
  {
    id: "u3",
    email: "sara.bennani@devoteam.com",
    firstName: "Sara",
    lastName: "Bennani",
    role: "COLLABORATOR",
    status: "ACTIVE",
    squadId: "s2",
    squadName: "Data & AI"
  },
  {
    id: "u4",
    email: "mehdi.fassi@devoteam.com",
    firstName: "Mehdi",
    lastName: "Fassi",
    role: "TRAINING_MANAGER",
    status: "ACTIVE",
    squadId: "s3",
    squadName: "Software Engineering"
  }
];

export const demoAssignments: Assignment[] = [
  {
    id: "a1",
    itemType: "CERTIFICATION",
    itemId: "c1",
    userId: "u3",
    userName: "Sara Bennani",
    statusCertification: "IN_PROGRESS",
    assignedAt: "2026-07-02T09:00:00Z",
    examAt: "2026-08-12T09:00:00Z",
    notes: "Targeting the summer certification window."
  },
  {
    id: "a2",
    itemType: "TRAINING",
    itemId: "t2",
    userId: "u2",
    userName: "Amine El Idrissi",
    statusTraining: "COMPLETED",
    trainingProgressPercentage: 100,
    assignedAt: "2026-06-18T09:00:00Z",
    completedAt: "2026-07-07T09:00:00Z",
    notes: "Completed internal baseline."
  },
  {
    id: "a3",
    itemType: "CERTIFICATION",
    itemId: "c4",
    userId: "u4",
    userName: "Mehdi Fassi",
    statusCertification: "PLANNED",
    assignedAt: "2026-07-10T09:00:00Z",
    notes: "Waiting for bootcamp slot."
  }
];

export const demoNotifications: Notification[] = [
  {
    id: "n1",
    type: "WARNING",
    title: "Exam deadline approaching",
    message: "Sara Bennani has an AWS exam planned in less than 30 days.",
    isRead: false,
    actionUrl: "/assignments",
    createdAt: "2026-07-21T10:30:00Z"
  },
  {
    id: "n2",
    type: "SUCCESS",
    title: "Training completed",
    message: "Amine El Idrissi completed Secure Delivery Foundations.",
    isRead: false,
    actionUrl: "/assignments",
    createdAt: "2026-07-20T15:15:00Z"
  },
  {
    id: "n3",
    type: "INFO",
    title: "Catalogue updated",
    message: "Four priority certifications are ready for squad mapping.",
    isRead: true,
    actionUrl: "/certifications",
    createdAt: "2026-07-19T08:00:00Z"
  }
];

export const demoHierarchy: HierarchyNode[] = [
  {
    managerId: "u2",
    firstName: "Amine",
    lastName: "El Idrissi",
    email: "amine.elidrissi@devoteam.com",
    collaboratorCount: 7
  },
  {
    managerId: "u4",
    firstName: "Mehdi",
    lastName: "Fassi",
    email: "mehdi.fassi@devoteam.com",
    collaboratorCount: 5
  }
];

export const demoDashboard: DashboardStats = {
  totalCertifications: 53,
  totalTrainings: 18,
  totalUsers: 42,
  totalSquads: 6,
  certificationsByProvider: [
    { label: "AWS", value: 16 },
    { label: "Microsoft", value: 14 },
    { label: "Google Cloud", value: 9 },
    { label: "Linux Foundation", value: 6 },
    { label: "Other", value: 8 }
  ],
  certificationsBySquad: [
    { label: "Cloud Platform", value: 19 },
    { label: "Data & AI", value: 12 },
    { label: "Software", value: 10 },
    { label: "Security", value: 7 },
    { label: "Delivery", value: 5 }
  ],
  certificationsByDifficulty: [
    { label: "Foundational", value: 12 },
    { label: "Associate", value: 20 },
    { label: "Professional", value: 16 },
    { label: "Expert", value: 5 }
  ]
};
