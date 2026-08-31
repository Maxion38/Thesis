import { Injectable, signal } from '@angular/core';

// État partagé entre AssessmentsLayoutComponent (bouton evals-btn) et
// AssessmentDetailComponent (affichage des votes des autres enseignants) :
// les deux vivent de part et d'autre d'un <router-outlet>, donc pas de lien
// parent/enfant direct pour se passer cette info via des @Input.
@Injectable({ providedIn: 'root' })
export class EvaluationsVisibilityService {
  readonly showOtherVotes = signal(false);

  toggle(): void {
    this.showOtherVotes.update(v => !v);
  }
}
