import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { InvitationService } from '../../services/invitations.service';


@Component({
  selector: 'app-register-activate-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activate-account.component.html',
  styleUrls: ['./activate-account.component.scss'],
})
export class RegisterActivateAccountComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  activationLinkValid: boolean | null = null;
  email!: string;
  token!: string;


  constructor(
    private fb: FormBuilder,
    private invitationService: InvitationService,
    private router: Router,
    private route: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      // email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
      confirmPassword: ['', [Validators.required]],
      surname: ['', [Validators.required]],
      firstname: [''],
    }, { validators: this.passwordMatchValidator });

    this.token = this.route.snapshot.queryParamMap.get('token')!;

    if (this.token) {
      this.invitationService.verifyActivationLink(this.token).subscribe({
        next: (result) => {
          this.activationLinkValid = result.valid;
          if (result.valid) {
            this.email = result.email;
          }
          this.changeDetectorRef.detectChanges();
        },
        error: () => {
          this.activationLinkValid = false;
        }
      });
    } else {
      this.activationLinkValid = false;
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ ...confirmPassword.errors, mismatch: true });
      return { mismatch: true };
    } else {
      if (confirmPassword?.hasError('mismatch')) {
        const errors = { ...confirmPassword.errors };
        delete errors['mismatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
      return null;
    }
  }

  // get email() {
  //   return this.form.get('email');
  // }

  get password() {
    return this.form.get('password');
  }

  get confirmPassword() {
    return this.form.get('confirmPassword');
  }

  get surname() {
    return this.form.get('surname');
  }

  get firstname() {
    return this.form.get('firstname');
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.activationLinkValid) {
      return;
    }

    const { confirmPassword, ...formData } = this.form.value;
    
    const activationData = {
      ...formData,
      token: this.token,
    };

    console.log('TOKEN FRONT:', this.token);
    console.log('PAYLOAD:', activationData);

    this.invitationService.activateAccount(activationData).subscribe({
      next: () => {
        this.router.navigate(['']);
      },
      error: (err) => {
        console.error('Register failed', err);
      }
    });
  }
}