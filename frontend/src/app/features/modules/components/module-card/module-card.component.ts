import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ModuleModel, ConditionsModel } from '../../models/module.model';

@Component({
  selector: 'app-module-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './module-card.component.html',
  styleUrls: ['./module-card.component.scss']
})

export class ModuleCardComponent implements OnInit {

  moduleId!: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  @Input({ required: true }) moduleData!: ModuleModel;  

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('moduleId');

      if (id) {
        this.moduleId = id;
      }
    });
  }

  get accessConditions(): ConditionsModel[] {
    const accessConditions: ConditionsModel[] = [];

    for (const condition of this.moduleData.conditions ?? []) {
      if (condition.type === "ACCESS") {
        accessConditions.push(condition);
      }
    }

    return accessConditions;
  }

  get successConditions(): ConditionsModel[] {
    const successConditions: ConditionsModel[] = [];

    for (const condition of this.moduleData.conditions ?? []) {
      if (condition.type === "ACCESS") {
        successConditions.push(condition);
      }
    }

    return successConditions;
  }

  formatConditionValue(value: string | Date): string {
    if (value instanceof Date) {
      return new Intl.DateTimeFormat('fr-BE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(value);
    }

    return value;
  }
}