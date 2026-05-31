import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute, Router } from '@angular/router';
import { TabbarComponent, Tabs } from '../../../../components/tabbar/tabbar.component';
import { ModuleDetailsModel } from '../../model/module-details.model';
import { UsersService } from '../../../../users/services/users.service';
import { ModulesService } from '../../../services/modules.service';
import { switchMap } from 'rxjs';
// import { TrainingCoursesService } from '../../services/training-courses.service';
// import { TrainingCourseModel } from '../../models/training-course.model';

@Component({
  selector: 'app-student-module-layout',
  standalone: true,
  imports: [TabbarComponent, RouterOutlet, CommonModule],
  templateUrl: './module.layout.html',
  styleUrls: ['./module.layout.scss'],
})
export class StudentModuleLayoutComponent implements OnInit {
  moduleId!: number;
  module!: ModuleDetailsModel;

  tabbarItems: Tabs[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private modulesService: ModulesService,
  ) {}

  ngOnInit(): void {
    this.moduleId = Number(this.route.snapshot.paramMap.get('moduleId'));
    this.buildTabs();

    this.usersService.getMyFirstProject().pipe(
      switchMap(project => this.modulesService.getProjectModuleDetails(this.moduleId, project.id))
    ).subscribe({
      next: (module) => {
        this.module = module;
        this.cdr.detectChanges();
        console.log(module)
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  buildTabs() {
    this.tabbarItems = [
      {
        title: 'Description',
        route: `/student/modules/${this.moduleId}/description`
      },
      // tools built dynamicly
    ];
  }

  get moduleTitle(): string {
    return this.module?.name ?? '';
  }
}