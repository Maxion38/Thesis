import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModuleOverviewModel, ModuleToolGroupModel, ConditionModel } from '../../model/module-overview.model';

@Component({
  selector: 'app-student-module-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-card.component.html',
  styleUrls: ['./module-card.component.scss']
})
export class StudentModuleCardComponent {
  @Input({ required: true }) module!: ModuleOverviewModel;

  get toolsSummary(): string {
    const groupTypes = this.module.groups.map(group => group.type);

    const countMap = groupTypes.reduce((acc, type) => {
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parts = Object.entries(countMap).map(([type, count]) => {
      const label = this.formatLabel(type);
      const finalLabel = count > 1 ? label + 's' : label;
      return count > 1 ? `${count} ${finalLabel}` : finalLabel;
    });

    return parts.join(' - ');
  }

  get hasSubmitables(): boolean {
    return this.countSubmission(this.module).submittableCount > 0;
  }

  get submissionStats() {
    return this.countSubmission(this.module);
  }

  get hasAssessment(): boolean {
    return this.module.groups.some(group => group.type === 'ASSESSMENT');
  }

  get hasOnlyCorrectedAssessments(): boolean {
    const assessments = this.module?.groups ?? [];

    // only ASSESSMENT
    const assessmentGroups = assessments.filter(
      g => g.type === 'ASSESSMENT'
    );

    // no evals, return false
    if (assessmentGroups.length === 0) {
      return false;
    }

    // every have to be CORRECTED
    return assessmentGroups.every(
      g => g.state === 'CORRECTED'
    );
  }

  get assessmentStateLabel(): string {
    const assessmentGroup = this.module.groups.find(group => group.type === 'ASSESSMENT');

    if (!assessmentGroup) {
      return '';
    }

    return this.formatLabel(assessmentGroup.state);
  }

  get progressPercentage(): number {
    const stats = this.submissionStats;

    if (!stats.submittableCount) {
      return 0;
    }

    return (stats.submittedCount / stats.submittableCount) * 100;
  }

  get actionLabelAndDates(): { label: string; dateLimit?: Date }[] {

    // Exclude allready subitted groups and not finished assessments
    const activeGroups = this.module.groups.filter(group => {

      if (group.state === 'SUBMITTED') {
        return false;
      }

      if (group.type === 'ASSESSMENT' && group.state !== 'CORRECTED') {
        return false;
      }

      return true;
    });

    const sortedGroups = this.sortGroupsByDateLimit(activeGroups);

    // Max 2 actions
    const topGroups = sortedGroups.slice(0, 2);

    if (topGroups.length === 0) {
      return [{ label: 'Voir le module' }];
    }

    const rawLabels = topGroups.map(group => this.formatActionsLabel(group.type));

    const labelCount: Record<string, number> = {};

    return topGroups.map(group => {

      const label = this.formatActionsLabel(group.type);

      labelCount[label] = (labelCount[label] ?? 0) + 1;

      const count = labelCount[label];

      const isDuplicate = rawLabels.filter(l => l === label).length > 1;

      return {
        label: isDuplicate ? `${label} ${count}` : label,
        dateLimit: group.date
      };
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

  private sortGroupsByDateLimit(groups: ModuleToolGroupModel[]): ModuleToolGroupModel[] {

    const typePriority: Record<string, number> = {
      WORK: 1,
      FORM: 2,
      ACTIVITY: 3,
      ASSESSMENT: 4,
    };

    return [...groups].sort((a, b) => {

      const aHasDate = !!a.date;
      const bHasDate = !!b.date;

      if (aHasDate && bHasDate) {
        return new Date(a.date!).getTime() - new Date(b.date!).getTime();
      }

      if (aHasDate && !bHasDate) return -1;
      if (!aHasDate && bHasDate) return 1;

      const priorityA = typePriority[a.type] ?? 99;
      const priorityB = typePriority[b.type] ?? 99;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return 0;
    });
  }

  getConditionsLabels(): string[] {
    const conditions = this.module?.status?.lockedBy ?? [];

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

  countSubmission(module: ModuleOverviewModel): {
    submittedCount: number;
    submittableCount: number;
  } {

    let submittedCount = 0;
    let submittableCount = 0;

    for (const group of module.groups) {

      if (group.state === 'SUBMITTED') {
        submittedCount++;
      }

      if (group.type === 'FORM' || group.type === 'WORK') {
        submittableCount++;
      }
    }

    return { submittedCount, submittableCount };
  }

  private formatLabel(label: string): string {
    const labelsMap: Record<string, string> = {
      FORM: 'Formulaire',
      ACTIVITY: 'Activité',
      WORK: 'Remise de travail',
      ASSESSMENT: 'Évaluation',
      UNTOUCHED: 'En attente',
      SUBMITTED: 'Soumis',
      CORRECTED: 'Corrigé',
    };

    return labelsMap[label] ?? label;
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