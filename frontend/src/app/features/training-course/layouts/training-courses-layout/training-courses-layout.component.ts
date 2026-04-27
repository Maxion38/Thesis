import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TabbarComponent, TabbarItem } from '../../../components/tabbar/tabbar.component';


@Component({
  selector: 'app-training-courses-layout',
  imports: [TabbarComponent, RouterOutlet],
  templateUrl: './training-courses-layout.component.html',
  styleUrls: ['./training-courses-layout.component.scss'],
})

export class TrainingCoursesLayoutComponent {
  tabbarItems: TabbarItem[] = [
    { titre: 'Création', route: '/training-courses/creation'},
    { titre: 'Planification', route: '/training-courses/planning'},
  ];
}