import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth.layout'
import { MainLayoutComponent } from './layouts/main-layout/main.layout';

import { DashboardComponent } from './features/pages/dashboard/dashboard.component';

import { TrainingCourseLayoutComponent } from './features/training-course/layouts/training-course-layout/training-course-layout.component'
import { TrainingCoursesLayoutComponent } from './features/training-course/layouts/training-courses-layout/training-courses-layout.component'
import { TrainingCoursesComponent } from './features/training-course/pages/trainings-list/training-courses.component'
import { TrainingCoursesPlanningComponent } from './features/training-course/pages/trainings-planning/training-courses-planning.component'
import { AssignmentsComponent } from './features/training-course/pages/assignments/assignments.component'
import { PlanningComponent } from './features/training-course/pages/planning/planning.component'
import { ModulesComponent } from './features/modules/pages/modules.component'
import { ModuleEditorComponent } from './features/modules/pages/editor/module-editor.component'
import { ModuleConditionsComponent } from './features/modules/pages/conditions/module-conditions.component'
import { ModuleDescriptionComponent } from './features/modules/pages/editor/module-description/module-description.component';

// import { UsersComponent } from './features/pages/users/users.component';
import { UsersLayoutComponent } from './features/users/layouts/users-layout/users.layout';
import { AllUsersComponent } from './features/users/pages/all-users/all-users.component';
import { InvitationsComponent } from './features/invitations/pages/invitations/invitations.component';

import { SupervisorsComponent } from './features/pages/supervisors/supervisors.component';
import { JuriesComponent } from './features/pages/juries/juries.component';
import { NotificationsComponent } from './features/pages/notifications/notifications.component';

import { RegisterBootstrapComponent } from './features/auth/pages/register-bootstrap/register.component';
import { RegisterActivateAccountComponent } from './features/invitations/pages/register-activate-account/activate-account.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { AuthGuard } from './features/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent},
      { path: 'register', component: RegisterBootstrapComponent},
      { path: 'activateAccount', component: RegisterActivateAccountComponent},
      { path: '**', redirectTo: 'login'},
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
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
        path: 'training-courses/:trainingCourseId', component: TrainingCourseLayoutComponent,
        children: [
          {path: '', redirectTo: 'modules', pathMatch: 'full'},
          {path: 'modules', component: ModulesComponent},
          {path: 'assignments', component: AssignmentsComponent},
          {path: 'planning', component: PlanningComponent},
        ]
      },
      { path: 'training-courses/:trainingCourseId/modules/:moduleId/editor', component: ModuleEditorComponent},
      { path: 'training-courses/:trainingCourseId/modules/:moduleId/editor/description', component: ModuleDescriptionComponent},
      { path: 'training-courses/:trainingCourseId/modules/:moduleId/conditions', component: ModuleConditionsComponent},

      { 
        path: 'users', component: UsersLayoutComponent,
        children: [
          {path: '', redirectTo: 'all', pathMatch: 'full'},
          {path: 'all', component: AllUsersComponent},
          {path: 'invitations', component: InvitationsComponent},
        ]
      }, 
      { path: 'supervisors', component: SupervisorsComponent},  
      { path: 'juries', component: JuriesComponent},  
      { path: 'notifications', component: NotificationsComponent},
      { path: '**', redirectTo: ''},
    ]
  }
];