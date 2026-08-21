import { isTrainingCourseActive } from './training-course-status.util';

describe('isTrainingCourseActive', () => {
  const now = new Date();

  it('should return true when now is within the start/end window', () => {
    const course = {
      startDate: new Date(now.getTime() - 86400000),
      endDate: new Date(now.getTime() + 86400000),
    };

    expect(isTrainingCourseActive(course)).toBe(true);
  });

  it('should return false when now is before the start date', () => {
    const course = {
      startDate: new Date(now.getTime() + 86400000),
      endDate: new Date(now.getTime() + 2 * 86400000),
    };

    expect(isTrainingCourseActive(course)).toBe(false);
  });

  it('should return false when now is after the end date', () => {
    const course = {
      startDate: new Date(now.getTime() - 2 * 86400000),
      endDate: new Date(now.getTime() - 86400000),
    };

    expect(isTrainingCourseActive(course)).toBe(false);
  });

  it('should return false when startDate or endDate is missing', () => {
    expect(isTrainingCourseActive({ startDate: null, endDate: new Date() })).toBe(false);
    expect(isTrainingCourseActive({ startDate: new Date(), endDate: null })).toBe(false);
    expect(isTrainingCourseActive({ startDate: null, endDate: null })).toBe(false);
  });
});
