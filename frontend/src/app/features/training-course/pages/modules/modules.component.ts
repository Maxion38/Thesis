import { Component } from '@angular/core';
import { TabbarComponent, TabbarItem } from '../../../components/tabbar/tabbar.component';

@Component({
  selector: 'app-modules',
  imports: [TabbarComponent],
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss'],
})

export class ModuleComponent {
  tabbarItems: TabbarItem[] = [
    { titre: 'Modules', route: '/training-courses/modules'},
    { titre: 'Création', route: '/training-courses/creation'},
    { titre: 'Planification', route: '/training-courses/planning'},
  ];
}