import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CriteriaModel } from '../../models/criteria.model';
import { DropdownComponent } from '../../../components/dropdown/dropdown.component';

export type CriteriaBrowserMode = 'single' | 'scroll';

// Coquille de navigation partagée teacher/étudiant : bascule entre "un
// critère à la fois" (sélecteur + dots + flèches, comme avant) et "grille
// complète scrollable". Le contenu de chaque critère (cellules, votes,
// feedback...) reste défini par le composant appelant via le template
// projeté #criterionRow, qui reçoit `criteria` dans son contexte.
@Component({
  selector: 'app-criteria-browser',
  standalone: true,
  imports: [CommonModule, DropdownComponent],
  templateUrl: './criteria-browser.component.html',
  styleUrl: './criteria-browser.component.scss',
})
export class CriteriaBrowserComponent {
  @Input() criteria: CriteriaModel[] = [];
  @Input() selectedOrder: number | null = null;
  @Input() mode: CriteriaBrowserMode = 'single';

  @Output() selectedOrderChange = new EventEmitter<number>();
  @Output() modeChange = new EventEmitter<CriteriaBrowserMode>();

  @ContentChild('criterionRow', { read: TemplateRef }) criterionTpl!: TemplateRef<{ criteria: CriteriaModel }>;

  get selectedCriteria(): CriteriaModel | undefined {
    return this.criteria.find(c => c.order === this.selectedOrder);
  }

  get selectedIndex(): number {
    return this.criteria.findIndex(c => c.order === this.selectedOrder);
  }

  select(order: number): void {
    if (order !== this.selectedOrder) {
      this.selectedOrderChange.emit(order);
    }
  }

  goPrevious(): void {
    if (this.criteria.length === 0) return;
    const index = this.selectedIndex;
    const previousIndex = index <= 0 ? this.criteria.length - 1 : index - 1;
    this.select(this.criteria[previousIndex].order);
  }

  goNext(): void {
    if (this.criteria.length === 0) return;
    const index = this.selectedIndex;
    const nextIndex = index >= this.criteria.length - 1 ? 0 : index + 1;
    this.select(this.criteria[nextIndex].order);
  }

  toggleMode(): void {
    const next: CriteriaBrowserMode = this.mode === 'single' ? 'scroll' : 'single';
    this.mode = next;
    this.modeChange.emit(next);
  }
}
