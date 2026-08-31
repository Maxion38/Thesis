import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TrainingCourseCardComponent } from '../../components/training-course-card/training-course-card.component'
import { DropdownComponent } from '../../../components/dropdown/dropdown.component';
import { TrainingCoursesService } from '../../services/training-courses.service';
import { TrainingCourseWithStats, getTrainingCourseStatus } from './../../models/training-course.model';

type StatusFilter = 'ALL' | 'ARCHIVED' | 'ACTIVE' | 'PLANNED';

@Component({
  selector: 'app-training-courses',
  templateUrl: './training-courses.component.html',
  styleUrls: ['./training-courses.component.scss'],
  imports: [CommonModule, RouterModule, FormsModule, TrainingCourseCardComponent, DropdownComponent],
})

export class TrainingCoursesComponent implements OnInit {
  allCourses: TrainingCourseWithStats[] = [];
  filteredCourses: TrainingCourseWithStats[] = [];

  searchText = '';
  selectedStatus: StatusFilter = 'ALL';
  statusFilterOptions: StatusFilter[] = ['ALL', 'ARCHIVED', 'ACTIVE', 'PLANNED'];

  isCreating = false;

  constructor(
    private trainingCoursesService: TrainingCoursesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.trainingCoursesService.getAllWithDetails().subscribe(courses => {
      this.allCourses = courses;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase().trim();

    this.filteredCourses = this.allCourses.filter(course => {
      if (this.selectedStatus !== 'ALL' && this.statusToFilter(course) !== this.selectedStatus) {
        return false;
      }

      if (search && !course.name.toLowerCase().includes(search)) {
        return false;
      }

      return true;
    });
  }

  private statusToFilter(course: TrainingCourseWithStats): StatusFilter | null {
    switch (getTrainingCourseStatus(course)) {
      case 'archived': return 'ARCHIVED';
      case 'active': return 'ACTIVE';
      case 'planned': return 'PLANNED';
      default: return null;
    }
  }

  selectStatus(status: StatusFilter): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  get selectedStatusLabel(): string {
    return this.getStatusFilterLabel(this.selectedStatus);
  }

  getStatusFilterLabel(status: StatusFilter): string {
    switch (status) {
      case 'ALL': return 'Tous';
      case 'ARCHIVED': return 'Archivés';
      case 'ACTIVE': return 'Actifs';
      case 'PLANNED': return 'Planifiés';
    }
  }

  onAdd(): void {
    if (this.isCreating) return;

    this.isCreating = true;

    this.trainingCoursesService.create({
      name: "Nouveau parcours de formation"
    }).subscribe({
      next: (created) => {
        this.router.navigate(['/coordinator/training-courses', created.id]);
      },
      error: () => {
        this.isCreating = false;
      },
      complete: () => {
        this.isCreating = false;
      }
    });
  }
}