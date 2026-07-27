// Centralized Enum Formatters according to exact backend Enum definitions

export const CERTIF_DIFFICULTY_LABELS: Record<string, string> = {
  FOUNDATIONAL: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  ADVANCED: 'Avancé',
  EXPERT: 'Expert'
};

export const CERTIF_PRIORITY_LABELS: Record<string, string> = {
  MANDATORY: 'Obligatoire',
  HIGH: 'Haute',
  NORMAL: 'Normale',
  ADVANCED: 'Avancée'
};

export const TRAINING_PRIORITY_LABELS: Record<string, string> = {
  MANDATORY: 'Obligatoire',
  OPTIONAL: 'Optionnelle'
};

export const CERTIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'En attente de validation',
  APPROVED: 'Approuvé',
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  EXAM_SCHEDULED: 'Examen programmé',
  COMPLETED: 'Obtenu',
  FAILED: 'Échoué',
  CANCELLED: 'Refusé / Annulé',
  EXPIRED: 'Expiré'
};

export const TRAINING_STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'En attente de validation',
  APPROVED: 'Approuvé',
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Refusé / Annulé'
};

export const TRAINING_TYPE_LABELS: Record<string, string> = {
  UDEMY_BUSINESS: 'Udemy Business',
  INTERNAL: 'Interne',
  EXTERNAL: 'Externe',
  CONFERENCE: 'Conférence'
};

export function formatStatus(status: string | undefined, itemType?: string): string {
  if (!status) return '-';
  if (itemType === 'TRAINING') {
    return TRAINING_STATUS_LABELS[status] || status;
  }
  return CERTIFICATION_STATUS_LABELS[status] || TRAINING_STATUS_LABELS[status] || status;
}

export function formatPriority(priority: string | undefined, isTraining?: boolean): string {
  if (!priority) return '-';
  if (isTraining) {
    return TRAINING_PRIORITY_LABELS[priority] || priority;
  }
  return CERTIF_PRIORITY_LABELS[priority] || priority;
}

export function formatDifficulty(difficulty: string | undefined): string {
  if (!difficulty) return '-';
  return CERTIF_DIFFICULTY_LABELS[difficulty] || difficulty;
}

export function formatTrainingType(type: string | undefined): string {
  if (!type) return '-';
  return TRAINING_TYPE_LABELS[type] || type;
}

export function getAssignmentProgressPercentage(ass: { itemType: string; statusCertification?: string; statusTraining?: string; trainingProgressPercentage?: number }): number {
  if (ass.itemType === 'TRAINING') {
    return ass.trainingProgressPercentage || 0;
  }
  const status = ass.statusCertification;
  switch (status) {
    case 'PENDING_APPROVAL': return 10;
    case 'APPROVED': return 25;
    case 'PLANNED': return 40;
    case 'IN_PROGRESS': return 60;
    case 'EXAM_SCHEDULED': return 80;
    case 'COMPLETED': return 100;
    case 'FAILED': return 50;
    case 'EXPIRED': return 50;
    case 'CANCELLED': default: return 0;
  }
}
