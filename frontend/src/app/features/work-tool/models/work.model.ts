export interface WorkModel {
  id: number;
  name: string;
  description: string;
  moduleId: number;
  dueDate: Date | null;
  maxAttempts: number;
}

export class CreateWorkModel {
  name!: string;
  description!: string;
  moduleId!: number;
  dueDate?: string;
  maxAttempts!: number;
}

export class UpdateWorkModel {
  name?: string;
  description?: string;
  moduleId?: number;
  dueDate?: string | null;
  maxAttempts?: number;
}

export interface WorkSubmissionModel {
  id: number;
  fileName: string;
  filePath: string;
  workId: number;
  userId: number;
  projectId: number;
  submittedAt: string;
  work: any;
}
