import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { TabbarComponent, TabbarItem } from '../../../components/tabbar/tabbar.component';

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
    private router: Router,
    private route: ActivatedRoute,
    private location: Location 
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.trainingCourseId = id;
        this.buildTabs();
      }
    });
  }

  buildTabs() {
    this.tabbarItems = [
      {
        titre: 'Modules',
        route: `/training-courses/${this.trainingCourseId}/modules`
      },
      {
        titre: 'Assignments',
        route: `/training-courses/${this.trainingCourseId}/assignments`
      },
      {
        titre: 'Planning',
        route: `/training-courses/${this.trainingCourseId}/planning`
      }
    ];
  }

  goBack() {
    this.router.navigate(['/training-courses', 'creation']);
  }
}