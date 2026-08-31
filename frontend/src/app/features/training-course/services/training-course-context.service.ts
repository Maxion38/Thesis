import { Injectable, inject } from '@angular/core';
import { Observable, Subject, map, of, shareReplay, tap } from 'rxjs';
import { TrainingCourseModel } from '../models/training-course.model';
import { TrainingCoursesService } from './training-courses.service';
import { AuthService } from '../../auth/services/auth.service';
import { RoleType } from '../../entities/role.entity';

const STORAGE_KEY = 'selectedTrainingCourseId';

@Injectable({
  providedIn: 'root'
})
export class TrainingCourseContextService {
  private trainingCoursesService = inject(TrainingCoursesService);
  private authService = inject(AuthService);

  private courses: TrainingCourseModel[] = [];
  private selected: TrainingCourseModel | null = null;
  private coursesLoaded$: Observable<TrainingCourseModel[]> | null = null;

  private changesSubject = new Subject<TrainingCourseModel | null>();
  readonly changes$ = this.changesSubject.asObservable();

  initIfApplicable(): Observable<TrainingCourseModel | null> {
    const role = this.authService.getFirstRole();

    if (role !== RoleType.TEACHER && role !== RoleType.STUDENT) {
      return of(null);
    }

    if (!this.coursesLoaded$) {
      this.coursesLoaded$ = this.trainingCoursesService.getMine().pipe(
        tap(courses => {
          this.courses = courses;

          const storedId = Number(localStorage.getItem(STORAGE_KEY));
          this.selected = courses.find(c => c.id === storedId) ?? courses[0] ?? null;
        }),
        shareReplay(1),
      );
    }

    // Map to `this.selected` on every subscription (not baked into the
    // shared observable) so a freshly-mounted component sees the currently
    // selected course, not whichever one was selected when courses first loaded.
    return this.coursesLoaded$.pipe(map(() => this.selected));
  }

  getCourses(): TrainingCourseModel[] {
    return this.courses;
  }

  getSelected(): TrainingCourseModel | null {
    return this.selected;
  }

  select(course: TrainingCourseModel): void {
    this.selected = course;
    localStorage.setItem(STORAGE_KEY, String(course.id));
    this.changesSubject.next(course);
  }

  reset(): void {
    this.courses = [];
    this.selected = null;
    this.coursesLoaded$ = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}
