import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { TabbarComponent, Tabs } from '../../../components/tabbar/tabbar.component';
import { TrainingCoursesService } from '../../services/training-courses.service';
import { BehaviorSubject } from 'rxjs';
import { TrainingCourseModel } from '../../models/training-course.model';


@Component({
  selector: 'app-training-course-layout',
  standalone: true,
  imports: [TabbarComponent, AsyncPipe, RouterOutlet],
  templateUrl: './training-course-layout.component.html',
  styleUrls: ['./training-course-layout.component.scss'],
})
export class TrainingCourseLayoutComponent implements OnInit {
  course$ = new BehaviorSubject<TrainingCourseModel | null>(null);
  trainingCourseId!: string;
  tabbarItems: Tabs[] = [];

  constructor(
    private route: ActivatedRoute,
    private trainingCoursesService: TrainingCoursesService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('trainingCourseId');

      if (id) {
        this.trainingCourseId = id;
        this.buildTabs();
        this.loadCourse();
      }
    });
  }

  loadCourse() {
    this.trainingCoursesService.getById(Number(this.trainingCourseId)).subscribe(course => {
      this.course$.next(course);
    });
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
      }
    ];
  }


  onTitleChange(newTitle: string) {
    this.trainingCoursesService.update(Number(this.trainingCourseId), {
      name: newTitle
    }).subscribe(updatedCourse => {
      this.course$.next(updatedCourse);
    });
  }
}  