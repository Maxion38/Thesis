import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth.layout'

import { DashboardComponent } from './features/pages/dashboard/dashboard.component';

import { TrainingCourseLayoutComponent } from './features/training-course/layouts/training-course-layout/training-course-layout.component'
import { TrainingCoursesLayoutComponent } from './features/training-course/layouts/training-courses-layout/training-courses-layout.component'
import { TrainingCoursesComponent } from './features/training-course/pages/trainings-list/training-courses.component'
import { TrainingCoursesPlanningComponent } from './features/training-course/pages/trainings-planning/training-courses-planning.component'
import { AssignmentsComponent } from './features/assignments/pages/assignments/assignments.component'
import { PlanningComponent } from './features/training-course/pages/planning/planning.component'
import { ModulesComponent } from './features/modules/modules-coordinator/pages/modules.component'
import { WorkComponent } from './features/work-tool/pages/work/work.component';
// import { ModuleConditionsComponent } from './features/modules/modules-coordinator/pages/conditions/module-conditions.component'
import { ModuleDescriptionComponent } from './features/modules/pages/module-description/module-description.component';

import { UsersLayoutComponent } from './features/users/layouts/users-layout/users.layout';
import { AllUsersComponent } from './features/users/pages/all-users/all-users.component';
import { InvitationsComponent } from './features/invitations/pages/invitations/invitations.component';

import { SupervisorsComponent } from './features/pages/supervisors/supervisors.component';
import { NotificationsComponent } from './features/pages/notifications/notifications.component';

import { RegisterBootstrapComponent } from './features/auth/pages/register-bootstrap/register.component';
import { RegisterActivateAccountComponent } from './features/invitations/pages/register-activate-account/activate-account.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { MainLayoutComponent } from './layouts/main-layout/main.layout';
import { MenuItem } from './features/components/menu/menu.component';
import { EmptyComponent } from './empty.component';
import { RootRedirectGuard } from './guards/root-redirect.guard';
import { NoAuthGuard } from './guards/no-auth.guard';
import { BootstrapGuard } from './guards/bootstrap.guard';
import { StudentModulesLayoutComponent } from './features/modules/modules-student/layouts/modules-layout/modules.layout';
import { StudentModuleLayoutComponent } from './features/modules/modules-student/layouts/module-layout/module.layout';
import { StudentModulesComponent } from './features/modules/modules-student/pages/modules/modules.component';
import { StudentModuleDescriptionComponent } from './features/modules/modules-student/pages/module/description/description.component';
import { ModuleLayoutComponent } from './features/modules/layouts/module-layout/module.layout';
import { UserInspectionComponent } from './features/user-inspection/layouts/inspection/user-inspection.layout';
import { SubmissionComponent } from './features/work-tool/pages/submissions/submissions.component';
import { AssessmentDetailComponent } from './features/assessments/pages/assessment/assessment-detail.component';
import { AssessmentsLayoutComponent } from './features/assessments/layout/assessments-layout/assessments.layout';
import { ProjectsLayoutComponent } from './features/projects/layouts/projects-layout/projects.layout';
import { AllProjectsComponent } from './features/projects/pages/all-projects/all-projects.component';
import { MyProjectsComponent } from './features/projects/pages/my-projects/my-projects.component';
import { ProjectOverviewComponent } from './features/projects/pages/project-overview/project-overview.component';


const coordinatorMenuItems: MenuItem[] = [
  { titre: 'Accueil', iconName: 'home', route: '/coordinator', exact: true },
  { titre: 'Parcours', iconName: 'school', route: '/coordinator/training-courses'},
  { titre: 'Participants', iconName: 'groups', route: '/coordinator/users'},
  { titre: 'Rapporteurs', iconName: 'assignment_ind', route: '/coordinator/supervisors'},
  { titre: 'Notifications', iconName: 'notifications', route: '/coordinator/notifications'},
];

const teacherMenuItems: MenuItem[] = [
  { titre: 'Accueil', iconName: 'home', route: '/teacher', exact: true },
  { titre: 'Projets', iconName: 'work', route: '/teacher/projects'},
  { titre: 'Rapportage', iconName: 'assignment_ind', route: '/teacher/supervisors'},
  { titre: 'Utilisateurs', iconName: 'groups', route: '/teacher/users'},
  { titre: 'Notifications', iconName: 'notifications', route: '/teacher/notifications'},
];

const studentMenuItems: MenuItem[] = [
  { titre: 'Accueil', iconName: 'home', route: '/student', exact: true },
  { titre: 'Modules', iconName: 'book', route: '/student/modules'},
  { titre: 'Rapporteur', iconName: 'assignment_ind', route: '/student/supervisors'},
  { titre: 'Notifications', iconName: 'notifications', route: '/student/notifications'},
];

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
    component: MainLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['COORDINATOR'], menuItems: coordinatorMenuItems },
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
      {path: 'training-courses/:trainingCourseId/modules/:moduleId', component: ModuleLayoutComponent,
        children: [
          {path: '', redirectTo: 'description', pathMatch: 'full'},
          {path: 'description', component: ModuleDescriptionComponent,},
          {path: 'work/:workId', component: WorkComponent,},
          // { path: 'assessment/:assessmentId', component: ModuleAssessmentComponent,},
          // { path: 'form/:formId', component: ModuleFormComponent,},
          // { path: 'activity/:activityId', component: ModuleActivityComponent,},
        ]
      },

      // { path: 'training-courses/:trainingCourseId/modules/:moduleId/editor', component: ModuleEditorComponent,},
      // { path: 'training-courses/:trainingCourseId/modules/:moduleId/editor/description', component: ModuleDescriptionComponent},
      // { path: 'training-courses/:trainingCourseId/modules/:moduleId/editor/work/:tooId', component: WorkEditorComponent},
      // { path: 'training-courses/:trainingCourseId/modules/:moduleId/conditions', component: ModuleConditionsComponent},
      { 
        path: 'users', component: UsersLayoutComponent,
        children: [
          {path: '', redirectTo: 'all', pathMatch: 'full'},
          {path: 'all', component: AllUsersComponent},
          {path: 'invitations', component: InvitationsComponent},
        ]
      },  
      { path: 'supervisors', component: SupervisorsComponent},  
      { path: 'notifications', component: NotificationsComponent},
    ]
  },
  {
    path: 'teacher',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['TEACHER'], menuItems: teacherMenuItems },
    children: [
      { path: '', component: DashboardComponent},

      // Inspection utilisateur : profil, infos générales, lien vers projet
      {
        path: 'users',
        component: UsersLayoutComponent,
        children: [
          { path: '', redirectTo: 'all', pathMatch: 'full'},
          { path: 'all', component: AllUsersComponent},
        ]
      },
      {
        path: 'users/:userId',
        component: UserInspectionComponent,
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full'},
          { path: 'profile', component: SubmissionComponent},
        ]
      },

      // Projets : soumissions, grilles d'évaluation
      {
        path: 'projects',
        component: ProjectsLayoutComponent,
        children: [
          { path: '', redirectTo: 'myProjects', pathMatch: 'full' },
          { path: 'myProjects', component: MyProjectsComponent },
          { path: 'all', component: AllProjectsComponent },
        ]
      },
      {
        path: 'projects/:projectId',
        component: ProjectOverviewComponent,
      },
      {
        path: 'projects/:projectId/assessments/:assessmentId',
        component: AssessmentsLayoutComponent,
        children: [
          { path: '', component: AssessmentDetailComponent },
          { path: 'criteria/:criteriaId', component: AssessmentDetailComponent },
        ]
      },

      { path: 'supervisors', component: SupervisorsComponent},
      { path: 'notifications', component: NotificationsComponent},
    ]
  },
  {
    path: 'student',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['STUDENT'], menuItems: studentMenuItems },
    children: [
      { path: '', component: DashboardComponent},
      { 
        path: 'modules', component: StudentModulesLayoutComponent,
        children: [
          { path: '', component: StudentModulesComponent},  
        ]
      },  
      { path: 'modules/:moduleId', component: ModuleLayoutComponent,
        children: [
          {path: '', redirectTo: 'description', pathMatch: 'full'},
          { path: 'description', component: ModuleDescriptionComponent,},
          { path: 'work/:workId', component: WorkComponent,},
          // { path: 'assessment/:assessmentId', component: ModuleAssessmentComponent,},
          // { path: 'form/:formId', component: ModuleFormComponent,},
          // { path: 'activity/:activityId', component: ModuleActivityComponent,},
        ]
      },
      // { 
      //   path: 'modules/:moduleId', component: StudentModuleLayoutComponent,
      //   children: [
      //     {path: '', redirectTo: 'description', pathMatch: 'full'},
      //     {path: 'description', component: StudentModuleDescriptionComponent},  
      //   ]
      // },  
      { path: 'supervisors', component: SupervisorsComponent},  
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