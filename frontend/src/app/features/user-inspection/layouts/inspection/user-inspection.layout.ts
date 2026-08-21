import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { merge } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { TabbarComponent, Tabs } from '../../../components/tabbar/tabbar.component';
import { UsersService } from '../../../users/services/users.service';
import { UserModel } from '../../../users/models/users.model';
import { TrainingCourseContextService } from '../../../training-course/services/training-course-context.service';
import { DropdownComponent } from '../../../components/dropdown/dropdown.component';


@Component({
  selector: 'app-user-inspection-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, BackButtonComponent, TabbarComponent, DropdownComponent],
  templateUrl: './user-inspection.layout.html',
  styleUrls: ['./user-inspection.layout.scss'],
})
export class UserInspectionComponent implements OnInit {
  tabbarItems: Tabs[] = [];
  isVisible: boolean = true;

  users!: UserModel[];
  selectedUser?: UserModel;

  constructor(
    private usersService: UsersService,
    private trainingCourseContext: TrainingCourseContextService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.buildTabs();

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

  buildTabs() {
    this.tabbarItems = [
      {
        title: 'Soumissions',
        route: 'submissions'
      },
      {
        title: 'Parcours',
        route: 'training-course'
      },
      {
        title: 'Profile',
        route: 'profile'
      },
    ]
  }

  selectUser(user: UserModel): void {
    this.selectedUser = user;
    this.router.navigate(['/teacher', 'users', user.id]);
  }

  getInitials(user: UserModel): string {
    const firstName = user.firstname || '';
    const lastName = user.surname || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  get backRoute() {
    return ['/teacher', 'users', 'all'];
  }
}