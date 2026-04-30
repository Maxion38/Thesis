import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ModuleContentItemCard } from './module-content-item.model'

@Component({
  selector: 'app-module-content-item',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule],
  templateUrl: './module-content-item.component.html',
  styleUrls: ['./module-content-item.component.scss']
})

export class ModuleContentItemComponent {
  @Input({ required: true }) card!: ModuleContentItemCard;

  get isRemovable(): boolean {
    return this.card.isRemovable ?? true;
  }
}