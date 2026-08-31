import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { GridFeedbackStatus } from '@prisma/client';

export class CellDto {
  description!: string;
  order!: number;
  weight!: number | null;
}

export class CriteriaDto {
  id!: number;
  name!: string;
  order!: number;
  defaultWeight!: number;
  cells!: CellDto[];
}

export class GridSummaryDto {
  id!: number;
  name!: string;
}

export class ProjectMemberSummaryDto {
  id!: number;
  firstname!: string | null;
  surname!: string;
}

export class ProjectWithGridsDto {
  id!: number;
  title!: string | null;
  students!: ProjectMemberSummaryDto[];
  grids!: GridSummaryDto[];
  worksSubmitted!: number;
  worksTotal!: number;
}

export class SetCriteriaNoteDto {
  @IsInt()
  projectId!: number;

  // Note continue (2 décimales) dans la plage de la cellule votée :
  // [cellOrder - 1 + 0.01, cellOrder], ou 0 pour la cellule d'ordre 0.
  // null = annulation du vote (retire la note existante sans supprimer le
  // reste de l'évaluation, ex. commentFeedback).
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  note!: number | null;
}

export class CriteriaAssessmentDto {
  note!: number | null;
  commentFeedback?: string | null;
}

export class EvaluationDto {
  criteriaId!: number;
  teacherId!: number;
  teacherFirstname!: string | null;
  teacherSurname!: string;
  note!: number | null;
  commentFeedback!: string | null;
  date!: Date | null;
}

export class SetCriteriaFeedbackDto {
  @IsInt()
  projectId!: number;

  @IsString()
  commentFeedback!: string;
}

export class CriteriaDiscussionDto {
  id!: number;
  comment!: string | null;
  teacherId!: number;
  teacherFirstname!: string | null;
  teacherSurname!: string;
  date!: Date | null;
}

export class CreateCriteriaDiscussionDto {
  @IsInt()
  projectId!: number;

  @IsString()
  @IsNotEmpty()
  comment!: string;
}

// résumé (statut de correction + soumission liée) affiché dans l'en-tête de
// la page d'évaluation : cf. GridFeedback.status et ToolLink (grid <-> work).
export class LinkedWorkSubmissionDto {
  workId!: number;
  submissionId!: number;
  fileName!: string;
}

export class GridContextDto {
  status!: GridFeedbackStatus;
  linkedSubmission!: LinkedWorkSubmissionDto | null;
  // true si l'utilisateur courant est le rapporteur (SUPERVISOR) du projet,
  // seul habilité à publier la grille (cf. AssessmentGridService.publishGrid).
  isSupervisor!: boolean;
}

export class PublishGridDto {
  @IsInt()
  projectId!: number;
}

// vue en lecture seule proposée à l'étudiant (description + grille + feedback
// des enseignants), sans discussions internes ni actions de notation.
export class StudentAssessmentViewDto {
  id!: number;
  name!: string;
  description!: string | null;
  status!: GridFeedbackStatus;
  criteria!: CriteriaDto[];
  evaluations!: EvaluationDto[];
}