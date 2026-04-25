import { Routes } from '@angular/router';
import { DashboardComponent } from './features/pages/dashboard/dashboard.component';

import {TrainingCourseComponent} from './features/training-course/pages/training-courses/training-courses.component'
import {ModuleComponent} from './features/training-course/pages/modules/modules.component'
import {ModuleEditorComponent} from './features/training-course/pages/modules-editor/modules-editor.component'
import {CreationComponent} from './features/training-course/pages/creation/creation.component'
import {PlanningComponent} from './features/training-course/pages/planning/planning.component'

import { UsersComponent } from './features/pages/users/users.component';
import { SupervisorsComponent } from './features/pages/supervisors/supervisors.component';
import { JuriesComponent } from './features/pages/juries/juries.component';
import { NotificationsComponent } from './features/pages/notifications/notifications.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent},
  { path: 'training-courses/:id/modules/editor', component: ModuleEditorComponent},
  { 
    path: 'training-courses/:id', component: "TrainingCourseLayoutComponent",
    children: [
      {path: '', redirectTo: 'modules', pathMatch: 'full'},
      {path: '/modules', component: ModuleComponent},
      {path: '/creation', component: CreationComponent},
      {path: '/planning', component: PlanningComponent},
    ]
  },
  { path: 'training-courses', component: "TrainingCourseListComponent"},

   
  { path: 'users', component: UsersComponent}, 
  { path: 'supervisors', component: SupervisorsComponent},  
  { path: 'juries', component: JuriesComponent},  
  { path: 'notifications', component: NotificationsComponent},
  { path: '**', redirectTo: ''},  
];