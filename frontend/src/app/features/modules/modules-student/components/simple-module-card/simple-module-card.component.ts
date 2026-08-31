import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModuleOverviewModel } from '../../model/module-overview.model';

interface ToolLabel {
  singular: string;
  plural: string;
}

const TOOL_LABELS: Record<string, ToolLabel> = {
  WORK: { singular: 'travail', plural: 'travaux' },
  FORM: { singular: 'formulaire', plural: 'formulaires' },
  ACTIVITY: { singular: 'activité', plural: 'activités' },
  ASSESSMENT: { singular: 'évaluation', plural: 'évaluations' },
};

@Component({
  selector: 'app-simple-module-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './simple-module-card.component.html',
  styleUrls: ['./simple-module-card.component.scss']
})
export class SimpleModuleCardComponent {
  @Input({ required: true }) module!: ModuleOverviewModel;

  // eg. "1x travail, 3x évaluations"
  get toolsSummary(): string {
    const countMap = this.module.groups.reduce((acc, tool) => {
      acc[tool.type] = (acc[tool.type] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countMap)
      .map(([type, count]) => {
        const label = TOOL_LABELS[type];
        const noun = count > 1 ? (label?.plural ?? type) : (label?.singular ?? type);
        return `${count}x ${noun}`;
      })
      .join(', ');
  }

  // Steps = every WORK/FORM/ASSESSMENT tool of the module. A WORK/FORM
  // step completes once submitted, an ASSESSMENT step once seen by the student.
  get submittableCount(): number {
    return this.module.groups.filter(tool =>
      tool.type === 'WORK' || tool.type === 'FORM' || tool.type === 'ASSESSMENT'
    ).length;
  }

  get completedCount(): number {
    return this.module.groups.filter(tool => {
      if (tool.type === 'WORK' || tool.type === 'FORM') return tool.state === 'SUBMITTED';
      if (tool.type === 'ASSESSMENT') return tool.state === 'SEEN';
      return false;
    }).length;
  }

  get hasSteps(): boolean {
    return this.submittableCount > 0;
  }

  get progressPercentage(): number {
    if (!this.submittableCount) return 0;
    return (this.completedCount / this.submittableCount) * 100;
  }
}
