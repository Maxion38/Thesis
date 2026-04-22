import { Component } from '@angular/core';
import { TabbarComponent, TabbarItem } from '../../../components/tabbar/tabbar.component';
import { CardComponent } from '../../components/card/card.component'
import { AddCardComponent } from '../../components/add-card/add-card.component'

@Component({
  selector: 'app-modules',
  imports: [TabbarComponent, CardComponent, AddCardComponent],
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