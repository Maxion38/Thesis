import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TabbarComponent, Tabs } from '../../../components/tabbar/tabbar.component';

@Component({
  selector: 'app-projects-layout',
  standalone: true,
  imports: [TabbarComponent, RouterOutlet, CommonModule],
  templateUrl: './projects.layout.html',
  styleUrls: ['./projects.layout.scss'],
})
export class ProjectsLayoutComponent {
  tabbarItems: Tabs[] = [
    {
      title: 'Tous les projets',
      route: '/teacher/projects/all'
    },
    {
      title: 'Mes projets',
      route: '/teacher/projects/myProjects'
    },
  ];
}
