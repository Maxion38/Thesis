import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-module-content-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-content-item.component.html',
  styleUrls: ['./module-content-item.component.scss']
})

export class ModuleContentItemComponent {
  @Input() title: string = "Titre";
  @Input() subtitle?: string;
  @Input() isRemovable: boolean = true;
}