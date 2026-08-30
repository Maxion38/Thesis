export interface ProjectOverviewSubmissionModel {
  id: number;
  fileName: string;
  submittedAt: string;
  submittedByFirstname: string | null;
  submittedBySurname: string;
}

export interface ProjectOverviewToolModel {
  id: number;
  name: string;
  type: 'WORK' | 'ASSESSMENT';

  dueDate?: string | null;
  submission?: ProjectOverviewSubmissionModel | null;

  corrected?: boolean;

  linkedToolId?: number | null;
}

export interface ProjectOverviewModuleModel {
  id: number;
  name: string;
  tools: ProjectOverviewToolModel[];
}
