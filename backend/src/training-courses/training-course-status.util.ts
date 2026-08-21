export function isTrainingCourseActive(course: { startDate: Date | null; endDate: Date | null }): boolean {
  const now = new Date();
  return !!course.startDate && !!course.endDate && now >= course.startDate && now <= course.endDate;
}
