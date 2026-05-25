import { ChangeDetectorRef , Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleType } from '../../../entities/role.entity';
import { UsersService } from '../../services/users.service';
import { UserModel } from '../../models/users.model';

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
  imports: [CommonModule, RouterModule, FormsModule],
})
export class AllUsersComponent implements OnInit {
  users: UserModel[] = [];
  trainingCourses: trainingCourse[] = [];

  mockTrainingCourses: trainingCourse[] = [
    { id: 1, label: "Parcours de formation TFE Q1" },
    { id: 2, label: "Parcours de formation TFE Q2" },
    { id: 3, label: "Parcours de formation stage Q1" },
    { id: 4, label: "Parcours de formation stage Q2" },
  ]; // TODO : replace this mock with real courses and link courses with user so filter can be done. Backend.

  userCards: UserCard[] = [];
  filteredUsers: UserCard[] = [];

  searchText: string = '';
  selectedRole: string = 'ALL';
  selectedCourseId: number | 'ALL' = 'ALL';

  constructor (
    private changeDetectorRef: ChangeDetectorRef,
    private usersService : UsersService,
  ) {}

  ngOnInit(): void {
    this.usersService.getAll().subscribe ({
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

  private buildUserCards(users: UserModel[]): UserCard[] {
    return users.flatMap(user =>
      user.roles.map(role => ({
        user,
        role,
      }))
    );
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    const filteredUsers = this.users
      .filter(user => {

        // ROLE FILTER
        if (
          this.selectedRole !== 'ALL' &&
          !user.roles.includes(this.selectedRole as RoleType)
        ) {
          return false;
        }

         // COURSE FILTER
        // if (this.selectedCourseId !== 'ALL') {
        //   const hasCourse = user.trainingCourses?.some(
        //     c => c.id === this.selectedCourseId
        //   );
        //   if (!hasCourse) return false;
        // }

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
}