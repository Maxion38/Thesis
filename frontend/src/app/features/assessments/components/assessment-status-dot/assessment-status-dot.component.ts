import { Component, Input } from '@angular/core';
import { GridFeedbackStatus } from '../../models/grid-context.model';

@Component({
  selector: 'app-assessment-status-dot',
  standalone: true,
  templateUrl: './assessment-status-dot.component.html',
  styleUrls: ['./assessment-status-dot.component.scss'],
})
export class AssessmentStatusDotComponent {
  @Input({ required: true }) status!: GridFeedbackStatus;
  @Input() size: 'sm' | 'md' = 'sm';

  get statusClass(): string {
    return this.status.toLowerCase();
  }
}
