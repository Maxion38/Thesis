import { Component } from '@angular/core';
import { TabbarComponent, TabbarItem } from '../../../components/tabbar/tabbar.component';

@Component({
  selector: 'app-planning',
  imports: [TabbarComponent],
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
})

export class PlanningComponent {
  tabbarItems: TabbarItem[] = [
    { titre: 'Modules', route: '/training-courses/modules'},
    { titre: 'Création', route: '/training-courses/creation'},
    { titre: 'Planification', route: '/training-courses/planning', exact: true},
  ];
}