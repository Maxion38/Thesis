import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConditionModel, ModuleToolGroupModel } from '../../model/module-overview.model';
import { StudentToolCardModel } from '../../model/student-tool-card.model';
import { GridFeedbackStatus, GRID_FEEDBACK_STATUS_LABELS } from '../../../../assessments/models/grid-context.model';
import { AssessmentStatusDotComponent } from '../../../../assessments/components/assessment-status-dot/assessment-status-dot.component';

export interface ModuleCardActionEvent {
  moduleId: number;
  toolId?: number;
}

@Component({
  selector: 'app-student-module-card',
  standalone: true,
  imports: [CommonModule, RouterModule, AssessmentStatusDotComponent],
  templateUrl: './module-card.component.html',
  styleUrls: ['./module-card.component.scss']
})
export class StudentModuleCardComponent {
  @Input({ required: true }) card!: StudentToolCardModel;
  @Output() ctaClicked = new EventEmitter<ModuleCardActionEvent>();

  get submissionTool(): ModuleToolGroupModel | undefined {
    return this.card.tools.find(tool => tool.type === 'WORK' || tool.type === 'FORM');
  }

  get hasSubmissionTool(): boolean {
    return !!this.submissionTool;
  }

  get submissionKindLabel(): string {
    return this.submissionTool?.type === 'FORM' ? 'Formulaire' : 'Travail';
  }

  get assessmentTool(): ModuleToolGroupModel | undefined {
    return this.card.tools.find(tool => tool.type === 'ASSESSMENT');
  }

  get hasAssessment(): boolean {
    return !!this.assessmentTool;
  }

  get assessmentStatus(): GridFeedbackStatus {
    return (this.assessmentTool?.state as GridFeedbackStatus) ?? 'PENDING';
  }

  get assessmentStateLabel(): string {
    if (!this.assessmentTool) {
      return '';
    }

    return GRID_FEEDBACK_STATUS_LABELS[this.assessmentStatus];
  }

  get actionLabelAndDates(): { label: string; dateLimit?: Date; toolId: number }[] {

    const activeTools = this.card.tools.filter(tool => {
      if (tool.state === 'SUBMITTED') return false;
      if (tool.type === 'ASSESSMENT' && tool.state !== 'PUBLISHED' && tool.state !== 'SEEN') return false;
      return true;
    });

    if (activeTools.length === 0) {
      return [{ label: 'Voir le module', toolId: this.card.tools[0]?.id ?? this.card.moduleId }];
    }

    const rawLabels = activeTools.map(tool => this.formatActionsLabel(tool.type));
    const labelCount: Record<string, number> = {};

    return activeTools.map(tool => {
      const label = this.formatActionsLabel(tool.type);
      labelCount[label] = (labelCount[label] ?? 0) + 1;
      const count = labelCount[label];
      const isDuplicate = rawLabels.filter(l => l === label).length > 1;

      return {
        label: isDuplicate ? `${label} ${count}` : label,
        dateLimit: tool.date,
        toolId: tool.id,
      };
    });
  }

  onCtaClick(toolId: number): void {
    this.ctaClicked.emit({
      moduleId: this.card.moduleId,
      toolId,
    });
  }

  getDateLabel(date?: Date): { label: string; isOverdue: boolean } | null {
    if (!date) return null;

    const days = this.getRemainingDays(date);

    if (days >= 0) {
      return { label: `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`, isOverdue: false };
    } else {
      const overdue = Math.abs(days);
      return { label: `Dépassé de ${overdue} jour${overdue > 1 ? 's' : ''}`, isOverdue: true };
    }
  }

  getRemainingDays(date?: Date): number {
    if (!date) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  getConditionsLabels(): string[] {
    const conditions = this.card?.lockedBy ?? [];

    return conditions.map(c => this.formatConditionLabel(c));
  }


  private formatActionsLabel(type: string): string {
    const labelsMap: Record<string, string> = {
      WORK: 'Rendre le travail',
      FORM: 'Compléter le formulaire',
      ACTIVITY: "Voir l'activité",
      ASSESSMENT: "Voir l'évaluation",
    };

    return labelsMap[type] ?? type;
  }

  private formatConditionLabel(condition: ConditionModel): string {
    switch (condition.method) {

      case 'USER_VALIDATION':
        return `Validation par ${condition.validatorName ?? 'un utilisateur'}`;

      case 'SUPERVISOR_VALIDATION':
        return `Validation par votre rapporteur (${condition.validatorName ?? 'inconnu'})`;

      case 'TOOL_SUBMISSION':
        return `Élément ${condition.toolName ?? 'outil inconnu'} soumis`;

      case 'DATE':
        return condition.date
          ? `Date dépassée (${this.formatDate(condition.date)})`
          : `Date non définie`;

      default:
        return 'Condition inconnue';
    }
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(new Date(date));
  }
}