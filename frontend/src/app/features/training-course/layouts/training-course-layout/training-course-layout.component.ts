import { Component, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute, Router } from '@angular/router';
import { TabbarComponent, Tabs } from '../../../components/tabbar/tabbar.component';
import { TrainingCoursesService } from '../../services/training-courses.service';
import { BehaviorSubject, Subject, switchMap, map, startWith, catchError, of } from 'rxjs';
import { TrainingCourseModel } from '../../models/training-course.model';

type CourseState = {
  status: 'loading' | 'success' | 'error';
  data: TrainingCourseModel | null;
  error: string | null;
};

@Component({
  selector: 'app-training-course-layout',
  standalone: true,
  imports: [TabbarComponent, AsyncPipe, RouterOutlet, CommonModule],
  templateUrl: './training-course-layout.component.html',
  styleUrls: ['./training-course-layout.component.scss'],
})
export class TrainingCourseLayoutComponent implements OnInit {
  trainingCourseId!: string;

  tabbarItems: Tabs[] = [];

  private refresh$ = new BehaviorSubject<void>(undefined);

  courseState$ = new BehaviorSubject<CourseState>({
    status: 'loading',
    data: null,
    error: null
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private trainingCoursesService: TrainingCoursesService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('trainingCourseId');

      if (id) {
        this.trainingCourseId = id;
        this.buildTabs();
        this.initCourseStream();
      }
    });
  }

  initCourseStream() {
    this.refresh$
      .pipe(
        switchMap(() => {
          this.courseState$.next({
            status: 'loading',
            data: this.courseState$.value.data,
            error: null
          });

          return this.trainingCoursesService.getById(Number(this.trainingCourseId));
        }),
        map(course => ({
          status: 'success' as const,
          data: course,
          error: null
        })),
        catchError(() =>
          of({
            status: 'error' as const,
            data: null,
            error: 'Erreur lors du chargement'
          })
        )
      )
      .subscribe(state => {
        this.courseState$.next(state);
      });
  }

  onTitleChange(newTitle: string) {
    this.trainingCoursesService
      .update(Number(this.trainingCourseId), {
        name: newTitle
      })
      .subscribe(() => {
        this.refresh$.next();
      });
  }

  onDelete() {
    console.log(Number(this.trainingCourseId));
    this.trainingCoursesService.delete(Number(this.trainingCourseId)).subscribe(() => {
      this.router.navigate(['/training-courses']);
    });
  }

  reloadCourse() {
    this.refresh$.next();
  }

  buildTabs() {
    this.tabbarItems = [
      {
        title: 'Modules',
        route: `/training-courses/${this.trainingCourseId}/modules`
      },
      {
        title: 'Assignations',
        route: `/training-courses/${this.trainingCourseId}/assignments`
      },
      {
        title: 'Planification',
        route: `/training-courses/${this.trainingCourseId}/planning`
      },
    ];
  }
}