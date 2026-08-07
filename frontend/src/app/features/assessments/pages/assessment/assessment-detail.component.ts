import { Component, OnInit } from '@angular/core';
import { TabbarComponent } from '../../../components/tabbar/tabbar.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-assessment-detail',
  imports: [FormsModule, TabbarComponent],
  templateUrl: './assessment-detail.component.html',
  styleUrl: './assessment-detail.component.scss',
})
export class AssessmentDetailComponent {
  tabs = [
    {
      title: "Détails",
      route: "./details",
      exact: true
    },
    {
      title: "Grille",
      route: "./grid"
    }
  ];

  score = 2;

  normalizeScore() {
    this.score = Math.min(2, Math.max(1, this.score));
    console.log(this.score);
  }

  incrementInput() {
    this.score = Math.min(2, Number((this.score + 0.1).toFixed(1)));
    this.normalizeScore();
  }

  decrementInput() {
    this.score = Math.max(1, Number((this.score - 0.1).toFixed(1)));
    this.normalizeScore();
  }
}
