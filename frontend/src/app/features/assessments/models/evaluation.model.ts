export interface EvaluationModel {
  criteriaId: number;
  teacherId: number;
  teacherFirstname: string | null;
  teacherSurname: string;
  note: number | null;
  commentFeedback: string | null;
  date: string | null;
}

export interface SetCriteriaNoteResultModel {
  note: number | null;
  commentFeedback?: string | null;
}
