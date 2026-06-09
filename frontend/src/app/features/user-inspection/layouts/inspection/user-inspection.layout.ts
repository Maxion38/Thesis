import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ModuleModel } from '../../../modules/modules-coordinator/models/module.model';
import { ModulesService } from '../../../modules/services/modules.service';
import { BackButtonComponent } from '../../../components/back-button/back-button.component';
import { TabbarComponent, Tabs } from '../../../components/tabbar/tabbar.component';
import { UsersService } from '../../../users/services/users.service';
import { UserModel } from '../../../users/models/users.model';
import { RoleType } from '../../../entities/role.entity';


@Component({
  selector: 'app-user-inspection-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, BackButtonComponent, TabbarComponent],
  templateUrl: './user-inspection.layout.html',
  styleUrls: ['./user-inspection.layout.scss'],
})
export class UserInspectionComponent implements OnInit {
  tabbarItems: Tabs[] = [];
  isVisible: boolean = true;
  showAddOptions = false;

  users!: UserModel[];
  selectedUser?: UserModel;

  constructor(
    private usersService: UsersService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.buildTabs();

    this.usersService.getAll().subscribe(users => {
      this.users = users;
      if (users.length > 0) {
        this.selectedUser = users[0];
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
    this.showAddOptions = false;
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