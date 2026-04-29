import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent } from '../../../../components/back-button/back-button.component';
import { ModuleContentItemComponent } from '../../../components/module-content-item/module-content-item.component';

@Component({
  selector: 'app-module-editor',
  standalone: true,
  imports: [CommonModule, BackButtonComponent, ModuleContentItemComponent],
  templateUrl: './module-editor.component.html',
  styleUrls: ['./module-editor.component.scss'],
})

export class ModuleEditorComponent {
}