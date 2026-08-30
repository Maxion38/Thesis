import { ChangeDetectorRef , Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RoleType, ROLE_BASE_ROUTE } from '../../../entities/role.entity';
import { UsersService } from '../../services/users.service';
import { UserModel } from '../../models/users.model';
import { AuthService } from '../../../auth/services/auth.service';
import { TrainingCourseContextService } from '../../../training-course/services/training-course-context.service';
import { TrainingCoursesService } from '../../../training-course/services/training-courses.service';
import { DropdownComponent } from '../../../components/dropdown/dropdown.component';

// TODO : exclude logged user

type UserCard = {
  user: UserModel;
  role: RoleType;
};

export interface trainingCourse {
  id: number;
  label: string;
}

@Component({
  selector: 'app-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent],
})
export class AllUsersComponent implements OnInit {
  protected readonly RoleType = RoleType;

  users: UserModel[] = [];
  trainingCourses: trainingCourse[] = [];
  role!: RoleType;

  userCards: UserCard[] = [];
  filteredUsers: UserCard[] = [];

  searchText: string = '';
  selectedRole: string = 'ALL';
  selectedCourseId: number | 'ALL' = 'ALL';

  constructor (
    private changeDetectorRef: ChangeDetectorRef,
    private usersService : UsersService,
    private authService : AuthService,
    private trainingCourseContext: TrainingCourseContextService,
    private trainingCoursesService: TrainingCoursesService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getFirstRole();

    if (this.role !== RoleType.TEACHER) {
      this.trainingCoursesService.getAll().subscribe({
        next: (courses) => {
          this.trainingCourses = courses.map(c => ({ id: c.id, label: c.name }));
          this.changeDetectorRef.detectChanges();
        },
        error: (err) => {
          console.error('Error loading training courses', err);
        }
      });
    }

    merge(
      this.trainingCourseContext.initIfApplicable(),
      this.trainingCourseContext.changes$,
    ).pipe(
      switchMap(course => this.usersService.getAll(course?.id)),
    ).subscribe ({
      next: (users) => {
        this.users = users;
        this.userCards = this.buildUserCards(users);
        this.filteredUsers = this.userCards;
        this.applyFilters();
        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users', err);
      }
    })
  }

  private loadUsers(trainingCourseId?: number): void {
    this.usersService.getAll(trainingCourseId).subscribe({
      next: (users) => {
        this.users = users;
        this.userCards = this.buildUserCards(users);
        this.applyFilters();
        this.changeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Error loading users', err);
      }
    });
  }

  private buildUserCards(users: UserModel[]): UserCard[] {
    return users.flatMap(user =>
      user.roles.map(role => ({
        user,
        role,
      }))
    );
  }

  applyFilters(): void {
    const currentUser = this.authService.getUser();
    const currentUserId = currentUser?.id;

    const search = this.searchText.toLowerCase().trim();

    const filteredUsers = this.users
      .filter(user => {
        // EXCLUDE CURRENT USER
        if (user.id === currentUserId) {
          return false;
        }

        // ROLE FILTER
        if (
          this.selectedRole !== 'ALL' &&
          !user.roles.includes(this.selectedRole as RoleType)
        ) {
          return false;
        }

        return true;
      });

    const cards = this.buildUserCards(filteredUsers);

    const result = cards
      .map(card => {
        const fullName =
          `${card.user.firstname ?? ''} ${card.user.surname}`.toLowerCase();

        let score = 0;

        if (search) {
          if (fullName === search) score += 100;
          else if (fullName.startsWith(search)) score += 50;
          else if (fullName.includes(search)) score += 10;

          if (card.user.surname.toLowerCase().includes(search)) score += 5;
          if (card.user.firstname?.toLowerCase().includes(search)) score += 5;
        }

        return { card, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(x => x.card);

    this.filteredUsers = result;
  }

  getRoleLabel(role: RoleType): string {
    switch (role) {
      case 'STUDENT':
        return 'Étudiant';
      case 'TEACHER':
        return 'Enseignant';
      case 'COORDINATOR':
        return 'Coordinateur';
      default:
        return role;
    }
  }

  get roleFilterOptions(): string[] {
    const options = ['ALL', 'STUDENT', 'TEACHER', 'COORDINATOR'];
    return this.role === RoleType.TEACHER
      ? options.filter(o => o !== 'COORDINATOR')
      : options;
  }

  getRoleFilterLabel(role: string): string {
    return role === 'ALL' ? 'Tous' : this.getRoleLabel(role as RoleType);
  }

  selectRole(role: string): void {
    this.selectedRole = role;
    this.applyFilters();
  }

  get selectedRoleLabel(): string {
    return this.getRoleFilterLabel(this.selectedRole);
  }

  selectCourse(courseId: number | 'ALL'): void {
    this.selectedCourseId = courseId;
    this.loadUsers(courseId === 'ALL' ? undefined : courseId);
  }

  get selectedCourseLabel(): string {
    if (this.selectedCourseId === 'ALL') return 'Tous les parcours';
    return this.trainingCourses.find(c => c.id === this.selectedCourseId)?.label ?? 'Tous les parcours';
  }

  isClickable(card: UserCard): boolean {
    return this.role === RoleType.TEACHER || this.role === RoleType.COORDINATOR;
  }

  onUserCardClick(card: UserCard): void {
    this.router.navigate([`/${ROLE_BASE_ROUTE[this.role]}/users`, card.user.id]);
  }
}