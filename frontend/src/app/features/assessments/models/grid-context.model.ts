export type GridFeedbackStatus = 'PENDING' | 'CORRECTION' | 'PUBLISHED' | 'SEEN';

export const GRID_FEEDBACK_STATUS_LABELS: Record<GridFeedbackStatus, string> = {
  PENDING: 'En attente',
  CORRECTION: 'En correction',
  PUBLISHED: 'Publiée',
  SEEN: 'Vu par l\'étudiant',
};

export interface LinkedWorkSubmissionModel {
  workId: number;
  submissionId: number;
  fileName: string;
}

export interface GridContextModel {
  status: GridFeedbackStatus;
  linkedSubmission: LinkedWorkSubmissionModel | null;
}
