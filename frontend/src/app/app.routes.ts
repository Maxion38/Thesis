import { Routes } from '@angular/router';
import { DashboardComponent } from './features/pages/dashboard/dashboard.component';

import {} from './features/training-course/layouts/training-course-layout/training-course-layout.compenent'
import {} from './features/training-course/layouts/training-course-layout/training-courses-layout.compenent'

import {} from './features/training-course/pages/trainings-list/training-courses.compenent'
import {} from './features/training-course/pages/trainings-planning/training-courses-planning.compenent'
import {} from './features/training-course/pages/modules/modules.component'
import {} from './features/training-course/pages/modules/editor/modules-editor.component'
import {} from './features/training-course/pages/modules/conditions/modules-conditions.component'

import { UsersComponent } from './features/pages/users/users.component';
import { SupervisorsComponent } from './features/pages/supervisors/supervisors.component';
import { JuriesComponent } from './features/pages/juries/juries.component';
import { NotificationsComponent } from './features/pages/notifications/notifications.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent},

  { 
    path: 'training-courses', component: "TrainingCoursesLayoutComponent",
    children: [
      {path: '', redirectTo: 'creation', pathMatch: 'full'},
      {path: 'creation', component: "TrainingCoursesComponent"},
      {path: 'planning', component: "TrainingCoursesPlanningComponent"},
    ]
  }, 
  {
    path: 'training-courses/:id', component: "TrainingCourseLayoutComponent",
    children: [
      {path: '', redirectTo: 'modules', pathMatch: 'full'},
      {path: 'modules', component: "ModuleComponent"},
      {path: 'assignments', component: "AssignmentsComponent"},
      {path: 'planning', component: "PlanningComponent"},
    ]
  },
  { path: 'training-courses/:id/modules/editor', component: "ModuleEditorComponent"},
  { path: 'training-courses/:id/modules/conditions', component: "ModuleConditionsComponent"},

  { path: 'users', component: UsersComponent}, 
  { path: 'supervisors', component: SupervisorsComponent},  
  { path: 'juries', component: JuriesComponent},  
  { path: 'notifications', component: NotificationsComponent},
  { path: '**', redirectTo: ''},  
];