import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { TabbarComponent, Tabs } from '../../../components/tabbar/tabbar.component';

@Component({
  selector: 'app-users-layout',
  standalone: true,
  imports: [TabbarComponent, RouterOutlet, CommonModule],
  templateUrl: './users.layout.html',
  styleUrls: ['./users.layout.scss'],
})
export class UsersLayoutComponent implements OnInit {
  tabbarItems: Tabs[] = [];

  constructor(
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.buildTabs();
  }

  buildTabs() {
    this.tabbarItems = [
      {
        title: 'Tous les utilisateurs',
        route: `/users/all`
      },
      {
        title: 'Invitations',
        route: `/users/invitations`
      },
    ];
  }
}