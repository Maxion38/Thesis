import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TrainingCourseCard } from './training-course-card.model';

@Component({
  selector: 'app-training-course-card',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './training-course-card.component.html',
  styleUrls: ['./training-course-card.component.scss']
})
export class TrainingCourseCardComponent {
  @Input({ required: true }) card!: TrainingCourseCard;
}