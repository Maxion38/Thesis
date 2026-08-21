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
  private init$: Observable<TrainingCourseModel | null> | null = null;

  private changesSubject = new Subject<TrainingCourseModel | null>();
  readonly changes$ = this.changesSubject.asObservable();

  initIfApplicable(): Observable<TrainingCourseModel | null> {
    const role = this.authService.getFirstRole();

    if (role !== RoleType.TEACHER && role !== RoleType.STUDENT) {
      return of(null);
    }

    if (!this.init$) {
      this.init$ = this.trainingCoursesService.getMine().pipe(
        tap(courses => {
          this.courses = courses;

          const storedId = Number(localStorage.getItem(STORAGE_KEY));
          this.selected = courses.find(c => c.id === storedId) ?? courses[0] ?? null;
        }),
        map(() => this.selected),
        shareReplay(1),
      );
    }

    return this.init$;
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
    this.init$ = null;
    localStorage.removeItem(STORAGE_KEY);
  }
}
