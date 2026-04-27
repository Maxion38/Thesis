import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-module-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-editor.component.html',
  styleUrls: ['./module-editor.component.scss'],
})

export class ModuleEditorComponent {
  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }
}