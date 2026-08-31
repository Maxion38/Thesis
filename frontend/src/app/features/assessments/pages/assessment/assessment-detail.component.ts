import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { switchMap, map, takeUntil, filter, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AssessmentGridService } from '../../services/assessments.service';
import { EvaluationsVisibilityService } from '../../services/evaluations-visibility.service';
import { CriteriaModel } from '../../models/criteria.model';
import { CellModel } from '../../models/cell.model';
import { EvaluationModel } from '../../models/evaluation.model';
import { CriteriaDiscussionModel } from '../../models/discussion.model';
import { AuthService } from '../../../auth/services/auth.service';
import { CriteriaBrowserComponent, CriteriaBrowserMode } from '../../components/criteria-browser/criteria-browser.component';
import { RegisterElementDirective } from '../../directives/register-element.directive';

@Component({
  selector: 'app-assessment-detail',
  imports: [FormsModule, CommonModule, CriteriaBrowserComponent, RegisterElementDirective],
  templateUrl: './assessment-detail.component.html',
  styleUrl: './assessment-detail.component.scss',
})
export class AssessmentDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private assessmentGridService = inject(AssessmentGridService);
  private authService = inject(AuthService);
  protected evaluationsVisibility = inject(EvaluationsVisibilityService);
  private destroy$ = new Subject<void>();

  // Au plus une seule ligne éditable à la fois (editingNoteCriteriaId), donc
  // un seul #noteInput présent dans le DOM.
  @ViewChildren('noteInput') noteInputRefs?: QueryList<ElementRef<HTMLInputElement>>;
  private discussionScrollEls = new Map<number, HTMLElement>();

  criteria: CriteriaModel[] = [];
  evaluations: EvaluationModel[] = [];
  selectedCriteriaOrder: number | null = null;
  viewMode: CriteriaBrowserMode = 'single';
  projectId!: number;
  assessmentId!: number;
  loading = false;
  votingCriteriaId: number | null = null;

  // Pas d'ajustement au clic sur les chevrons ; la base stocke jusqu'à 0.01
  // (atteignable via la saisie précise).
  readonly noteStep = 0.1;
  editingNoteCriteriaId: number | null = null;
  editValue: number | null = null;

  activeCommentTab: Record<number, 'discussion' | 'feedback'> = {};

  discussionsByCriteria: Record<number, CriteriaDiscussionModel[]> = {};
  loadingDiscussionsByCriteria: Record<number, boolean> = {};
  newDiscussionMessage: Record<number, string | undefined> = {};
  postingDiscussionCriteriaId: number | null = null;

  editingFeedbackCriteriaId: number | null = null;
  feedbackDraft = '';
  savingFeedback = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(params => ({
        projectId: Number(params.get('projectId')),
        assessmentId: Number(params.get('assessmentId')),
        criteriaId: params.get('criteriaId') ? Number(params.get('criteriaId')) : null,
      })),
      filter(p => !!p.projectId && !!p.assessmentId),
      tap(p => {
        this.projectId = p.projectId;
        this.assessmentId = p.assessmentId;
        this.selectedCriteriaOrder = p.criteriaId;
      }),
      switchMap(p => {
        this.loading = true;
        return forkJoin({
          criteria: this.assessmentGridService.getAssessmentGrid(p.assessmentId),
          evaluations: this.assessmentGridService.getGridEvaluations(p.assessmentId, p.projectId),
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ criteria, evaluations }) => {
        this.criteria = criteria.slice().sort((a, b) => a.order - b.order);
        this.evaluations = evaluations;

        if (this.selectedCriteriaOrder === null && this.criteria.length > 0) {
          this.navigateToCriteria(this.criteria[0].order, true);
          return;
        }

        this.loading = false;
        this.loadDiscussionsForCurrentView();
      },
      error: (err) => {
        console.error('Erreur récupération grille:', err);
        this.loading = false;
      }
    });
  }

  get selectedCriteria(): CriteriaModel | undefined {
    return this.criteria.find(c => c.order === this.selectedCriteriaOrder);
  }

  // Critères réellement rendus à l'écran, dans l'ordre du DOM : un seul en
  // mode "single", tous en mode "scroll". Sert à faire correspondre les
  // QueryList (#discussionScroll, #noteInput) au bon critère.
  visibleCriteria(): CriteriaModel[] {
    if (this.viewMode === 'scroll') return this.criteria;
    const sc = this.selectedCriteria;
    return sc ? [sc] : [];
  }

  onSelectedOrderChange(order: number): void {
    this.navigateToCriteria(order);
  }

  onModeChange(mode: CriteriaBrowserMode): void {
    this.viewMode = mode;
    this.loadDiscussionsForCurrentView();
  }

  protected get currentUserId(): number | undefined {
    return this.authService.getUser()?.id;
  }

  // Borne basse de la plage de note propre à une cellule : juste au-dessus
  // du max de la cellule précédente (résolution 0.01), sauf pour la
  // cellule d'ordre 0 qui n'a pas de palier en-dessous.
  cellMin(cell: CellModel): number {
    return cell.order === 0 ? 0 : this.round2(cell.order - 1 + 0.01);
  }

  canAdjust(cell: CellModel): boolean {
    return cell.order > 0;
  }

  formatNote(value: number): string {
    return String(this.round2(value));
  }

  myNote(criteria: CriteriaModel): number | null {
    const userId = this.currentUserId;
    if (userId === undefined) return null;
    return this.evaluations.find(e => e.criteriaId === criteria.id && e.teacherId === userId)?.note ?? null;
  }

  canSeeComments(criteria: CriteriaModel): boolean {
    return this.myNote(criteria) !== null || this.evaluationsVisibility.showOtherVotes();
  }

  private noteInCell(note: number | null, cell: CellModel): boolean {
    if (note === null) return false;
    const EPS = 0.0001;
    return note >= this.cellMin(cell) - EPS && note <= cell.order + EPS;
  }

  votersForCell(criteria: CriteriaModel, cell: CellModel): EvaluationModel[] {
    return this.evaluations.filter(e => e.criteriaId === criteria.id && this.noteInCell(e.note, cell));
  }

  isMyVote(criteria: CriteriaModel, cell: CellModel): boolean {
    return this.votersForCell(criteria, cell).some(v => v.teacherId === this.currentUserId);
  }

  getVoterInitials(evaluation: EvaluationModel): string {
    return this.initials(evaluation.teacherSurname, evaluation.teacherFirstname);
  }

  getDiscussionInitials(discussion: CriteriaDiscussionModel): string {
    return this.initials(discussion.teacherSurname, discussion.teacherFirstname);
  }

  private initials(surname: string, firstname: string | null): string {
    return surname.charAt(0).toUpperCase() + (firstname ?? '').charAt(0);
  }

  formatDate(value: string | Date | null): string {
    if (!value) return '';
    const d = new Date(value);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  }

  formatTime(value: string | Date | null): string {
    if (!value) return '';
    const d = new Date(value);
    return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
  }

  selectCell(criteria: CriteriaModel, cell: CellModel): void {
    if (this.isMyVote(criteria, cell)) {
      this.applyNote(criteria, null);
    } else {
      this.applyNote(criteria, cell.order);
    }
  }

  adjustNote(criteria: CriteriaModel, cell: CellModel, delta: number): void {
    if (!this.isMyVote(criteria, cell)) return;
    const current = this.myNote(criteria) ?? cell.order;
    const next = this.clampNote(current + delta, cell);
    if (next !== current) {
      this.applyNote(criteria, next);
    }
  }

  startEditNote(criteria: CriteriaModel, cell: CellModel): void {
    if (!this.isMyVote(criteria, cell) || this.votingCriteriaId !== null) return;
    this.editValue = this.myNote(criteria) ?? cell.order;
    this.editingNoteCriteriaId = criteria.id;
    setTimeout(() => this.noteInputRefs?.first?.nativeElement.focus());
  }

  commitEditNote(criteria: CriteriaModel, cell: CellModel): void {
    if (this.editValue !== null && !isNaN(this.editValue)) {
      const next = this.clampNote(this.editValue, cell);
      this.applyNote(criteria, next);
    }
    this.editingNoteCriteriaId = null;
    this.editValue = null;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private clampNote(value: number, cell: CellModel): number {
    return Math.min(cell.order, Math.max(this.cellMin(cell), this.round2(value)));
  }

  private applyNote(criteria: CriteriaModel, note: number | null): void {
    const userId = this.currentUserId;
    if (userId === undefined || this.votingCriteriaId !== null) return;

    this.votingCriteriaId = criteria.id;
    const currentUser = this.authService.getUser();
    const existing = this.evaluations.find(e => e.criteriaId === criteria.id && e.teacherId === userId);

    this.assessmentGridService.setCriteriaNote(criteria.id, this.projectId, note).subscribe({
      next: () => {
        this.evaluations = [
          ...this.evaluations.filter(e => !(e.criteriaId === criteria.id && e.teacherId === userId)),
          {
            criteriaId: criteria.id,
            teacherId: userId,
            teacherFirstname: existing?.teacherFirstname ?? currentUser?.firstname ?? null,
            teacherSurname: existing?.teacherSurname ?? currentUser?.surname ?? '',
            note,
            commentFeedback: existing?.commentFeedback ?? null,
            date: new Date().toISOString(),
          },
        ];
        this.votingCriteriaId = null;
      },
      error: (err) => {
        console.error('Erreur enregistrement du vote:', err);
        this.votingCriteriaId = null;
      }
    });
  }

  // --- Discussions (chat interne, jamais visible étudiant) ---

  getActiveTab(criteriaId: number): 'discussion' | 'feedback' {
    return this.activeCommentTab[criteriaId] ?? 'discussion';
  }

  setActiveTab(criteriaId: number, tab: 'discussion' | 'feedback'): void {
    this.activeCommentTab[criteriaId] = tab;
  }

  getDiscussions(criteriaId: number): CriteriaDiscussionModel[] {
    return this.discussionsByCriteria[criteriaId] ?? [];
  }

  isLoadingDiscussions(criteriaId: number): boolean {
    return !!this.loadingDiscussionsByCriteria[criteriaId];
  }

  onDiscussionScrollRegistered(event: { key: number; element: HTMLElement }): void {
    this.discussionScrollEls.set(event.key, event.element);
  }

  private loadDiscussionsForCurrentView(): void {
    for (const criteria of this.visibleCriteria()) {
      if (this.discussionsByCriteria[criteria.id] === undefined) {
        this.loadDiscussionsFor(criteria.id);
      }
    }
  }

  private loadDiscussionsFor(criteriaId: number): void {
    this.loadingDiscussionsByCriteria[criteriaId] = true;
    this.assessmentGridService.getCriteriaDiscussions(criteriaId, this.projectId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (discussions) => {
        this.discussionsByCriteria[criteriaId] = discussions;
        this.loadingDiscussionsByCriteria[criteriaId] = false;
        this.scrollDiscussionsToBottom(criteriaId);
      },
      error: (err) => {
        console.error('Erreur récupération des discussions:', err);
        this.loadingDiscussionsByCriteria[criteriaId] = false;
      }
    });
  }

  isMyDiscussionMessage(discussion: CriteriaDiscussionModel): boolean {
    return discussion.teacherId === this.currentUserId;
  }

  sendDiscussionMessage(criteria: CriteriaModel): void {
    const comment = (this.newDiscussionMessage[criteria.id] ?? '').trim();
    if (!comment || this.postingDiscussionCriteriaId !== null) return;

    this.postingDiscussionCriteriaId = criteria.id;
    this.assessmentGridService.postCriteriaDiscussion(criteria.id, this.projectId, comment).subscribe({
      next: (discussion) => {
        this.discussionsByCriteria[criteria.id] = [...this.getDiscussions(criteria.id), discussion];
        this.newDiscussionMessage[criteria.id] = '';
        this.postingDiscussionCriteriaId = null;
        this.scrollDiscussionsToBottom(criteria.id);
      },
      error: (err) => {
        console.error('Erreur envoi du message:', err);
        this.postingDiscussionCriteriaId = null;
      }
    });
  }

  private scrollDiscussionsToBottom(criteriaId: number): void {
    setTimeout(() => {
      const el = this.discussionScrollEls.get(criteriaId);
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  // --- Feedback (commentaire par enseignant, visible étudiant une fois la grille publiée) ---

  criteriaFeedbackCards(criteria: CriteriaModel): EvaluationModel[] {
    const userId = this.currentUserId;
    const others = this.evaluations.filter(e =>
      e.criteriaId === criteria.id && e.teacherId !== userId && !!e.commentFeedback
    );

    if (userId === undefined) return others;

    const currentUser = this.authService.getUser();
    const ownCard = this.evaluations.find(e => e.criteriaId === criteria.id && e.teacherId === userId) ?? {
      criteriaId: criteria.id,
      teacherId: userId,
      teacherFirstname: currentUser?.firstname ?? null,
      teacherSurname: currentUser?.surname ?? '',
      note: null,
      commentFeedback: null,
      date: null,
    };

    return [ownCard, ...others];
  }

  trackByTeacherId(_index: number, card: EvaluationModel): number {
    return card.teacherId;
  }

  startEditFeedback(criteria: CriteriaModel, card: EvaluationModel): void {
    if (card.teacherId !== this.currentUserId || this.savingFeedback) return;
    this.feedbackDraft = card.commentFeedback ?? '';
    this.editingFeedbackCriteriaId = criteria.id;
  }

  cancelEditFeedback(): void {
    this.editingFeedbackCriteriaId = null;
    this.feedbackDraft = '';
  }

  saveFeedback(criteria: CriteriaModel): void {
    const userId = this.currentUserId;
    if (userId === undefined || this.savingFeedback) return;

    const comment = this.feedbackDraft.trim();
    const existing = this.evaluations.find(e => e.criteriaId === criteria.id && e.teacherId === userId);
    const currentUser = this.authService.getUser();

    this.savingFeedback = true;
    this.assessmentGridService.setCriteriaFeedback(criteria.id, this.projectId, comment).subscribe({
      next: () => {
        this.evaluations = [
          ...this.evaluations.filter(e => !(e.criteriaId === criteria.id && e.teacherId === userId)),
          {
            criteriaId: criteria.id,
            teacherId: userId,
            teacherFirstname: existing?.teacherFirstname ?? currentUser?.firstname ?? null,
            teacherSurname: existing?.teacherSurname ?? currentUser?.surname ?? '',
            note: existing?.note ?? null,
            commentFeedback: comment,
            date: new Date().toISOString(),
          },
        ];
        this.editingFeedbackCriteriaId = null;
        this.savingFeedback = false;
      },
      error: (err) => {
        console.error('Erreur enregistrement du feedback:', err);
        this.savingFeedback = false;
      }
    });
  }

  private navigateToCriteria(order: number, replaceUrl = false): void {
    this.router.navigate(
      ['/teacher/projects', this.projectId, 'assessments', this.assessmentId, 'criteria', order],
      { replaceUrl, queryParamsHandling: 'preserve' }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
