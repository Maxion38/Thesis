import { Component, Output, Input, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';
import { TrainingCourseContextService } from '../../training-course/services/training-course-context.service';
import { TrainingCourseModel } from '../../training-course/models/training-course.model';
import { RoleType } from '../../entities/role.entity';
import { Router } from '@angular/router';
import { UserModel } from '../../users/models/users.model';
import { merge } from 'rxjs';
import { DropdownComponent } from '../dropdown/dropdown.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, DropdownComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Input() open = false;
  @Input() menuName = 'Dashboard';
  @Output() menuToggle = new EventEmitter<void>();

  user!: UserModel;
  role?: RoleType;

  courses: TrainingCourseModel[] = [];
  selectedCourse: TrainingCourseModel | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private trainingCourseContext: TrainingCourseContextService,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.role = this.authService.getFirstRole();

    if (this.showCourseSwitcher) {
      merge(
        this.trainingCourseContext.initIfApplicable(),
        this.trainingCourseContext.changes$,
      ).subscribe(() => {
        this.courses = this.trainingCourseContext.getCourses();
        this.selectedCourse = this.trainingCourseContext.getSelected();
      });
    }
  }

  get showCourseSwitcher(): boolean {
    return this.role !== RoleType.COORDINATOR;
  }

  selectCourse(course: TrainingCourseModel): void {
    if (course.id !== this.selectedCourse?.id) {
      this.trainingCourseContext.select(course);
    }
  }

  onClick() {
    this.menuToggle.emit();
  }

  logout() {
    this.trainingCourseContext.reset();
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
