import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { TabbarComponent, TabbarItem } from '../../../components/tabbar/tabbar.component';
import { CardComponent } from '../../components/card/card.component'
import { AddCardComponent } from '../../components/add-card/add-card.component'
import { ModulesService } from '../../services/modules.service';
import { Module } from '../../models/module.model';

@Component({
  selector: 'app-modules',
  imports: [CommonModule, TabbarComponent, CardComponent, AddCardComponent, RouterOutlet, RouterModule],
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss'],
})

export class ModuleComponent {
  tabbarItems: TabbarItem[] = [
    { titre: 'Modules', route: '/training-courses/modules'},
    { titre: 'Création', route: '/training-courses/creation'},
    { titre: 'Planification', route: '/training-courses/planning'},
  ];

  modules$: Observable<Module[]>;

  constructor(private modulesService: ModulesService) {
    this.modules$ = this.modulesService.getModules();
  }
}