import { Component, Output, Input, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  @Input() open = false;
  @Input() menuName = 'Dashboard';
  @Output() menuToggle = new EventEmitter<void>();

  onClick() {
    this.menuToggle.emit();
  }
}

