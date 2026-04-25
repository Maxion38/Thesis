import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-modules-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modules-editor.component.html',
  styleUrls: ['./modules-editor.component.scss'],
})

export class ModuleEditorComponent {
  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }
}