export interface CriteriaDiscussionModel {
  id: number;
  comment: string | null;
  teacherId: number;
  teacherFirstname: string | null;
  teacherSurname: string;
  date: string | null;
}
