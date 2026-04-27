import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ModuleCard } from './module-card.model';

@Component({
  selector: 'app-module-card',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './module-card.component.html',
  styleUrls: ['./module-card.component.scss']
})

export class ModuleCardComponent {
  @Input({ required: true }) card!: ModuleCard;  
}