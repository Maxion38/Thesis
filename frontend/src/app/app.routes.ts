import { Routes } from '@angular/router';
import { DashboardComponent } from './features/pages/dashboard/dashboard.component';

import { TrainingCourseLayoutComponent } from './features/training-course/layouts/training-course-layout/training-course-layout.component'
import { TrainingCoursesLayoutComponent } from './features/training-course/layouts/training-courses-layout/training-courses-layout.component'
import { TrainingCoursesComponent } from './features/training-course/pages/trainings-list/training-courses.component'
import { TrainingCoursesPlanningComponent } from './features/training-course/pages/trainings-planning/training-courses-planning.component'
import { AssignmentsComponent } from './features/training-course/pages/assignments/assignments.component'
import { PlanningComponent } from './features/training-course/pages/planning/planning.component'
import { ModuleComponent } from './features/training-course/pages/modules/modules.component'
import { ModuleEditorComponent } from './features/training-course/pages/modules/editor/module-editor.component'
import { ModuleConditionsComponent } from './features/training-course/pages/modules/conditions/module-conditions.component'

import { UsersComponent } from './features/pages/users/users.component';
import { SupervisorsComponent } from './features/pages/supervisors/supervisors.component';
import { JuriesComponent } from './features/pages/juries/juries.component';
import { NotificationsComponent } from './features/pages/notifications/notifications.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent},

  { 
    path: 'training-courses', component: TrainingCoursesLayoutComponent,
    children: [
      {path: '', redirectTo: 'creation', pathMatch: 'full'},
      {path: 'creation', component: TrainingCoursesComponent},
      {path: 'planning', component: TrainingCoursesPlanningComponent},
    ]
  }, 
  {
    path: 'training-courses/:id', component: TrainingCourseLayoutComponent,
    children: [
      {path: '', redirectTo: 'modules', pathMatch: 'full'},
      {path: 'modules', component: ModuleComponent},
      {path: 'assignments', component: AssignmentsComponent},
      {path: 'planning', component: PlanningComponent},
    ]
  },
  { path: 'training-courses/:id/modules/editor', component: ModuleEditorComponent},
  { path: 'training-courses/:id/modules/conditions', component: ModuleConditionsComponent},

  { path: 'users', component: UsersComponent}, 
  { path: 'supervisors', component: SupervisorsComponent},  
  { path: 'juries', component: JuriesComponent},  
  { path: 'notifications', component: NotificationsComponent},
  { path: '**', redirectTo: ''},  
];