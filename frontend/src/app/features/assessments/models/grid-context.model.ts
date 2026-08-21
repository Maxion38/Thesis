export type GridFeedbackStatus = 'PENDING' | 'CORRECTION' | 'PUBLISHED' | 'SEEN';

export interface LinkedWorkSubmissionModel {
  workId: number;
  submissionId: number;
  fileName: string;
}

export interface GridContextModel {
  status: GridFeedbackStatus;
  linkedSubmission: LinkedWorkSubmissionModel | null;
}
