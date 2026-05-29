import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth.layout'

import { DashboardComponent } from './features/pages/dashboard/dashboard.component';

import { TrainingCourseLayoutComponent } from './features/training-course/layouts/training-course-layout/training-course-layout.component'
import { TrainingCoursesLayoutComponent } from './features/training-course/layouts/training-courses-layout/training-courses-layout.component'
import { TrainingCoursesComponent } from './features/training-course/pages/trainings-list/training-courses.component'
import { TrainingCoursesPlanningComponent } from './features/training-course/pages/trainings-planning/training-courses-planning.component'
import { AssignmentsComponent } from './features/assignments/pages/assignments/assignments.component'
import { PlanningComponent } from './features/training-course/pages/planning/planning.component'
import { ModulesComponent } from './features/modules-coordinator/pages/modules.component'
import { ModuleEditorComponent } from './features/modules-coordinator/pages/editor/module-editor.component'
import { ModuleConditionsComponent } from './features/modules-coordinator/pages/conditions/module-conditions.component'
import { ModuleDescriptionComponent } from './features/modules-coordinator/pages/editor/module-description/module-description.component';

import { UsersLayoutComponent } from './features/users/layouts/users-layout/users.layout';
import { AllUsersComponent } from './features/users/pages/all-users/all-users.component';
import { InvitationsComponent } from './features/invitations/pages/invitations/invitations.component';

import { SupervisorsComponent } from './features/pages/supervisors/supervisors.component';
import { JuriesComponent } from './features/pages/juries/juries.component';
import { NotificationsComponent } from './features/pages/notifications/notifications.component';

import { RegisterBootstrapComponent } from './features/auth/pages/register-bootstrap/register.component';
import { RegisterActivateAccountComponent } from './features/invitations/pages/register-activate-account/activate-account.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { CoordinatorLayoutComponent } from './layouts/coordinator-layout/coordinator.layout';
import { StudentLayoutComponent } from './layouts/student-layout/student.layout';
import { EmptyComponent } from './empty.component';
import { RootRedirectGuard } from './guards/root-redirect.guard';
import { NoAuthGuard } from './guards/no-auth.guard';
import { BootstrapGuard } from './guards/bootstrap.guard';
import { StudentModulesLayoutComponent } from './features/modules-student/layouts/users-layout/modules.layout';
import { StudentModulesComponent } from './features/modules-student/pages/modules/modules.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [NoAuthGuard],
    children: [
      { 
        path: 'login', 
        component: LoginComponent,
        canActivate: [BootstrapGuard],
      },
      { 
        path: 'register', 
        component: RegisterBootstrapComponent,
        canActivate: [BootstrapGuard],
      },
      { path: 'activateAccount', component: RegisterActivateAccountComponent},
      { path: '**', redirectTo: 'login'},
    ]
  },
  {
    path: 'coordinator',
    component: CoordinatorLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['COORDINATOR'] },
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
    ]
  },
  /*
  {
    path: 'teacher',
    component: TeacherLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['TEACHER'] },
    children: [...]
  }*/
  {
    path: 'student',
    component: StudentLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['STUDENT'] },
    children: [
      { path: '', component: DashboardComponent},
      { 
        path: 'modules', component: StudentModulesLayoutComponent,
        children: [
          {path: '', redirectTo: 'all', pathMatch: 'full'},
          { path: 'all', component: StudentModulesComponent},  
        ]
      },  
      { path: 'supervisors', component: SupervisorsComponent},  
      { path: 'juries', component: JuriesComponent},  
      { path: 'notifications', component: NotificationsComponent},
    ]
  },
  {
    path: '',
    component: EmptyComponent,
    canActivate: [RootRedirectGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];