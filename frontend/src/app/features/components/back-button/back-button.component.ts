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
  @Input() queryParams?: Record<string, any>;

  constructor(
    private router: Router,
    private location: Location,
  ) {}

  goBack() {
    if (this.route) {
      this.router.navigate(this.route, this.queryParams ? { queryParams: this.queryParams } : undefined);
    } else {
      this.location.back();
    }
  }
}