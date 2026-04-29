import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss']
})

export class BackButtonComponent {
  @Input() route?: (string | number)[];

  constructor(
    private router: Router,
    private location: Location,
  ) {}

  goBack() {
    if (this.route) {
      this.router.navigate(this.route);
    } else {
      this.location.back();
    }
  }
}