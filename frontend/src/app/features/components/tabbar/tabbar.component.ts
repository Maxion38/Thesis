import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface TabbarItem {
  titre: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-tabbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './tabbar.component.html',
  styleUrls: ['./tabbar.component.scss']
})
export class TabbarComponent {
  @Input() items: TabbarItem[] = [];
}