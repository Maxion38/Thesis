export interface TrainingCourseModel {
  id: number;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface TrainingCourseWithStats {
  id: number;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  studentsCount: number;
  teachersCount: number;
}