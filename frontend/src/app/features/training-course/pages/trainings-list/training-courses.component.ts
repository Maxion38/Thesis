import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TrainingCourseCardComponent } from '../../components/training-course-card/training-course-card.component'
import { TrainingCoursesService } from '../../services/training-courses.service';
import { TrainingCourseModel } from './../../models/training-course.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-training-courses',
  templateUrl: './training-courses.component.html',
  styleUrls: ['./training-courses.component.scss'],
  imports: [CommonModule, RouterModule, TrainingCourseCardComponent],
})

export class TrainingCoursesComponent implements OnInit {
  courses$!: Observable<TrainingCourseModel[]>;
  isCreating = false;

  constructor(
    private trainingCoursesService: TrainingCoursesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.courses$ = this.trainingCoursesService.getAll();
  }

  onAdd(): void {
    if (this.isCreating) return;

    this.isCreating = true;

    this.trainingCoursesService.create({
      name: "Nouveau parcours de formation"
    }).subscribe({
      next: (created) => {
        this.router.navigate(['/training-courses', created.id]);
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