import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {

  form!: FormGroup;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.authService.bootstrapStatus().subscribe((isEnabled) => {
      if (isEnabled) {
        this.router.navigate(['/auth/register']);
      }
    });
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    const data = {
      email: this.form.value.email,
      password: this.form.value.password,
    };

    this.authService.login(data).subscribe({
      next: () => {
        this.authService.checkAuth().subscribe(user => {
          this.authService.setUser(user);

          const role = this.authService.getFirstRole();

          if (role === 'COORDINATOR') {
            this.router.navigate(['/coordinator']);
          } else if (role === 'TEACHER') {
            this.router.navigate(['/teacher']);
          } else {
            this.router.navigate(['/student']);
          }
        });
      },
      error: (err) => {
        console.error('Login failed', err);
      }
    });
  }
}