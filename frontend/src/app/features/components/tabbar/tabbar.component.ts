import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '../back-button/back-button.component';

export interface Tabs {
  title: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-tabbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, BackButtonComponent],
  templateUrl: './tabbar.component.html',
  styleUrls: ['./tabbar.component.scss']
})

export class TabbarComponent {
  @Input() tabs?: Tabs[];
  @Input() title?: string;
  @Input() isTitleEditable?: boolean = false;
  @Input() subtitle?: string;
  @Input() backButton?: boolean = false;
  @Input() backRoute?: (string | number)[];
}

