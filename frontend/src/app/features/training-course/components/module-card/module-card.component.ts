import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ModuleCard } from './module-card.model';

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

  @Input({ required: true }) card!: ModuleCard;  

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('moduleId');

      if (id) {
        this.moduleId = id;
      }
    });
  }

  get accessConditions() {
    return this.card.accessConditions ?? [];
  }

  get successConditions() {
    return this.card.successConditions ?? [];
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