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
  usersCount: number;
}

export type TrainingCourseStatus = 'archived' | 'active' | 'planned' | 'none';

export function getTrainingCourseStatus(
  course: { startDate?: string | Date | null; endDate?: string | Date | null }
): TrainingCourseStatus {
  if (!course.startDate || !course.endDate) return 'none';

  const now = new Date();
  const start = new Date(course.startDate);
  const end = new Date(course.endDate);

  if (now > end) return 'archived';
  if (now >= start) return 'active';
  return 'planned';
}