import { Component, OnInit } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { TabbarComponent, TabbarItem } from '../../../components/tabbar/tabbar.component';
import { TrainingCourseStateService } from '../../services/training-courses.service';

@Component({
  selector: 'app-training-course-layout',
  standalone: true,
  imports: [TabbarComponent, RouterOutlet],
  templateUrl: './training-course-layout.component.html',
  styleUrls: ['./training-course-layout.component.scss'],
})
export class TrainingCourseLayoutComponent implements OnInit {

  trainingCourseId!: string;

  tabbarItems: TabbarItem[] = [];

  constructor(
    private route: ActivatedRoute,
    public trainingCourseState: TrainingCourseStateService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('trainingCourseId');

      if (id) {
        this.trainingCourseId = id;
        this.buildTabs();
      }
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
}