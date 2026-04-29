import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TrainingCourseCard } from './training-course-card.model';
import { TrainingCourseStateService } from '../../services/training-courses.service';

@Component({
  selector: 'app-training-course-card',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './training-course-card.component.html',
  styleUrls: ['./training-course-card.component.scss']
})
export class TrainingCourseCardComponent {
  @Input({ required: true }) card!: TrainingCourseCard;

  constructor(private trainingCourseState: TrainingCourseStateService) {}

  onEditClick() {
    this.trainingCourseState.title.set(this.card.title);
  }
}