import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TabbarComponent, Tabs } from '../../../components/tabbar/tabbar.component';
import { AuthService } from '../../../auth/services/auth.service';
import { RoleType, ROLE_BASE_ROUTE } from '../../../entities/role.entity';

@Component({
  selector: 'app-users-layout',
  standalone: true,
  imports: [TabbarComponent, RouterOutlet, CommonModule],
  templateUrl: './users.layout.html',
  styleUrls: ['./users.layout.scss'],
})
export class UsersLayoutComponent implements OnInit {
  tabbarItems: Tabs[] = [];
  userRole!: RoleType;

  constructor(
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getFirstRole();

    this.buildTabs();
  }

  buildTabs() {
    this.tabbarItems = [
      {
        title: 'Tous les utilisateurs',
        route: `/${ROLE_BASE_ROUTE[this.userRole]}/users/all`
      },
    ]

    if (this.userRole === RoleType.COORDINATOR) {
      this.tabbarItems.push(
        {
          title: 'Invitations',
          route: `/${ROLE_BASE_ROUTE[this.userRole]}/users/invitations`
        },
      )
    }
  }
}