import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-student-modules-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './modules.layout.html',
  styleUrls: ['./modules.layout.scss'],
})
export class StudentModulesLayoutComponent {
}