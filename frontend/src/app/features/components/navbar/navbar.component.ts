import { Component, Output, Input, EventEmitter, OnInit } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';
import { UserModel } from '../../users/models/users.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit { 
  @Input() open = false;
  @Input() menuName = 'Dashboard';
  @Output() menuToggle = new EventEmitter<void>();

  user!: UserModel;

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser()
  }

  onClick() {
    this.menuToggle.emit();
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
  }

  get initials(): string {
    const surname = this.user?.surname ?? '';
    const firstname = this.user?.firstname ?? '';

    return `${surname.charAt(0)}${firstname.charAt(0)}`;
  }
}

