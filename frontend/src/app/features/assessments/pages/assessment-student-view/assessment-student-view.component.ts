import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AssessmentGridService } from '../../services/assessments.service';
import { StudentAssessmentViewModel } from '../../models/student-assessment-view.model';
import { CellModel } from '../../models/cell.model';
import { EvaluationModel } from '../../models/evaluation.model';
import { GridFeedbackStatus, GRID_FEEDBACK_STATUS_LABELS } from '../../models/grid-context.model';
import { MarkdownCardComponent } from '../../../components/markdown-card/markdown-card.component';
import { CriteriaBrowserComponent, CriteriaBrowserMode } from '../../components/criteria-browser/criteria-browser.component';

@Component({
  selector: 'app-assessment-student-view',
  standalone: true,
  imports: [CommonModule, MarkdownCardComponent, CriteriaBrowserComponent],
  templateUrl: './assessment-student-view.component.html',
  styleUrl: './assessment-student-view.component.scss',
})
export class AssessmentStudentViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private assessmentGridService = inject(AssessmentGridService);

  grid: StudentAssessmentViewModel | null = null;
  loading = false;

  selectedCriteriaOrder: number | null = null;
  viewMode: CriteriaBrowserMode = 'single';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const assessmentId = Number(params.get('assessmentId'));
      if (!assessmentId) return;

      this.loading = true;
      this.assessmentGridService.getMyAssessmentView(assessmentId).subscribe({
        next: (grid) => {
          this.grid = grid;
          this.loading = false;
          if (this.selectedCriteriaOrder === null && grid.criteria.length > 0) {
            this.selectedCriteriaOrder = grid.criteria.slice().sort((a, b) => a.order - b.order)[0].order;
          }
        },
        error: (err) => {
          console.error('Erreur récupération grille:', err);
          this.loading = false;
        }
      });
    });
  }

  statusLabel(status: GridFeedbackStatus): string {
    return GRID_FEEDBACK_STATUS_LABELS[status];
  }

  // les votes/feedback ne sont montrés à l'étudiant qu'une fois la grille
  // publiée (le backend ne renvoie de toute façon aucune evaluation avant ça).
  get gradesVisible(): boolean {
    return this.grid?.status === 'PUBLISHED' || this.grid?.status === 'SEEN';
  }

  // Aucune cellule n'est stockée en FK : on la retrouve en comparant la note
  // aux bornes cumulées des cellules du critère (même logique que côté prof).
  private cellMin(cell: CellModel): number {
    return cell.order === 0 ? 0 : Math.round((cell.order - 1 + 0.01) * 100) / 100;
  }

  private noteInCell(note: number | null, cell: CellModel): boolean {
    if (note === null) return false;
    const EPS = 0.0001;
    return note >= this.cellMin(cell) - EPS && note <= cell.order + EPS;
  }

  votersForCell(criteriaId: number, cell: CellModel): EvaluationModel[] {
    return (this.grid?.evaluations ?? []).filter(
      e => e.criteriaId === criteriaId && this.noteInCell(e.note, cell)
    );
  }

  feedbackFor(criteriaId: number): EvaluationModel[] {
    return (this.grid?.evaluations ?? []).filter(
      e => e.criteriaId === criteriaId && !!e.commentFeedback
    );
  }

  initials(evaluation: EvaluationModel): string {
    return evaluation.teacherSurname.charAt(0).toUpperCase() + (evaluation.teacherFirstname ?? '').charAt(0);
  }
}
