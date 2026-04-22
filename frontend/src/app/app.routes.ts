import { Routes } from '@angular/router';
import { DashboardComponent } from './features/pages/dashboard/dashboard.component';

import {ModuleComponent} from './features/pages/training-courses/modules/modules.component'
import {CreationComponent} from './features/pages/training-courses/creation/creation.component'
import {PlanningComponent} from './features/pages/training-courses/planning/planning.component'

import { UsersComponent } from './features/pages/users/users.component';
import { SupervisorsComponent } from './features/pages/supervisors/supervisors.component';
import { JuriesComponent } from './features/pages/juries/juries.component';
import { NotificationsComponent } from './features/pages/notifications/notifications.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent},
  { 
    path: 'training-courses',
    children: [
      { path: 'modules', component: ModuleComponent },
      { path: 'creation', component: CreationComponent },
      { path: 'planning', component: PlanningComponent },
      { path: '', redirectTo: 'modules', pathMatch: 'full'},  
    ]
  },  
  { path: 'users', component: UsersComponent}, 
  { path: 'supervisors', component: SupervisorsComponent},  
  { path: 'juries', component: JuriesComponent},  
  { path: 'notifications', component: NotificationsComponent},
  { path: '**', redirectTo: ''},  
];