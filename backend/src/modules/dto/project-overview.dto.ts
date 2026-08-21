export class ProjectOverviewSubmissionDto {
  id!: number;
  fileName!: string;
  submittedAt!: Date;
  submittedByFirstname!: string | null;
  submittedBySurname!: string;
}

export class ProjectOverviewToolDto {
  id!: number;
  name!: string;
  type!: 'WORK' | 'ASSESSMENT';

  // WORK only
  dueDate?: Date | null;
  submission?: ProjectOverviewSubmissionDto | null;

  // ASSESSMENT only
  corrected?: boolean;
}

export class ProjectOverviewModuleDto {
  id!: number;
  name!: string;
  tools!: ProjectOverviewToolDto[];
}
