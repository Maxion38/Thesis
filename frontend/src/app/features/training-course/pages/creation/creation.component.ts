import { Component } from '@angular/core';
import { TabbarComponent, TabbarItem } from '../../../components/tabbar/tabbar.component';

@Component({
  selector: 'app-creation',
  imports: [TabbarComponent],
  templateUrl: './creation.component.html',
  styleUrls: ['./creation.component.scss'],
})

export class CreationComponent {
  tabbarItems: TabbarItem[] = [
    { titre: 'Modules', route: '/training-courses/modules'},
    { titre: 'Création', route: '/training-courses/creation'},
    { titre: 'Planification', route: '/training-courses/planning'},
  ];
}