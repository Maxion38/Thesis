import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabbarComponent } from '../../../../../components/tabbar/tabbar.component';

@Component({
  selector: 'app-training-courses',
  templateUrl: './module-description.component.html',
  styleUrls: ['./module-description.component.scss'],
  imports: [CommonModule, TabbarComponent],
})

export class ModuleDescriptionComponent {
}