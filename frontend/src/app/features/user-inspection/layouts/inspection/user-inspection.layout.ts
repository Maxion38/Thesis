import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { merge } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { UsersService } from '../../../users/services/users.service';
import { UserModel } from '../../../users/models/users.model';
import { TrainingCourseContextService } from '../../../training-course/services/training-course-context.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RoleType, ROLE_BASE_ROUTE } from '../../../entities/role.entity';
import { DropdownComponent } from '../../../components/dropdown/dropdown.component';


@Component({
  selector: 'app-user-inspection-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, BackButtonComponent, DropdownComponent],
  templateUrl: './user-inspection.layout.html',
  styleUrls: ['./user-inspection.layout.scss'],
})
export class UserInspectionComponent implements OnInit {
  userRole!: RoleType;

  users!: UserModel[];
  selectedUser?: UserModel;

  constructor(
    private usersService: UsersService,
    private trainingCourseContext: TrainingCourseContextService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getFirstRole();

    const selectedUserId = Number(this.route.snapshot.paramMap.get('userId'));

    merge(
      this.trainingCourseContext.initIfApplicable(),
      this.trainingCourseContext.changes$,
    ).pipe(
      switchMap(course => this.usersService.getAll(course?.id)),
    ).subscribe(users => {
      this.users = users;
      if (users.length > 0) {
        this.selectedUser = users.find(user => user.id === selectedUserId);
      }
    });
  }

  selectUser(user: UserModel): void {
    if (user.id === this.selectedUser?.id) return;

    this.selectedUser = user;
    this.router.navigate([`/${ROLE_BASE_ROUTE[this.userRole]}`, 'users', user.id]);
  }

  getUserLabel(user: UserModel): string {
    return `${user.firstname || ''} ${user.surname}`.trim();
  }

  get backRoute() {
    return [`/${ROLE_BASE_ROUTE[this.userRole]}`, 'users', 'all'];
  }
}