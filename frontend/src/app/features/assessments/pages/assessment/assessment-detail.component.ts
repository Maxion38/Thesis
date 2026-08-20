import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef, ViewChild  } from '@angular/core';
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

@Component({
  selector: 'app-assessment-detail',
  imports: [FormsModule, CommonModule],
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

  @ViewChild('criteriaSelector') criteriaSelector!: ElementRef<HTMLElement>;
  @ViewChild('noteInput') noteInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('discussionScroll') discussionScrollRef?: ElementRef<HTMLElement>;

  criteria: CriteriaModel[] = [];
  evaluations: EvaluationModel[] = [];
  selectedCriteriaOrder: number | null = null;
  projectId!: number;
  assessmentId!: number;
  loading = false;
  isDropdownOpen = false;
  votingCriteriaId: number | null = null;

  // Pas d'ajustement au clic sur les chevrons ; la base stocke jusqu'à 0.01
  // (atteignable via la saisie précise).
  readonly noteStep = 0.1;
  editingNote = false;
  editValue: number | null = null;

  activeCommentTab: 'discussion' | 'feedback' = 'discussion';

  discussions: CriteriaDiscussionModel[] = [];
  loadingDiscussions = false;
  newDiscussionMessage = '';
  postingDiscussion = false;

  editingFeedback = false;
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
        }

        this.loading = false;
        this.loadDiscussions();
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

  get selectedCriteriaIndex(): number {
    return this.criteria.findIndex(c => c.order === this.selectedCriteriaOrder);
  }

  goToPreviousCriteria(): void {
    if (this.criteria.length === 0) return;
    const index = this.selectedCriteriaIndex;
    // wraparound : si on est au premier, on va au dernier
    const previousIndex = index <= 0 ? this.criteria.length - 1 : index - 1;
    this.navigateToCriteria(this.criteria[previousIndex].order);
  }

  goToNextCriteria(): void {
    if (this.criteria.length === 0) return;
    const index = this.selectedCriteriaIndex;
    // wraparound : si on est au dernier, on retourne au premier
    const nextIndex = index >= this.criteria.length - 1 ? 0 : index + 1;
    this.navigateToCriteria(this.criteria[nextIndex].order);
  }

  selectCriteria(order: number): void {
    this.isDropdownOpen = false;
    if (order !== this.selectedCriteriaOrder) {
      this.navigateToCriteria(order);
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.isDropdownOpen &&
      this.criteriaSelector &&
      !this.criteriaSelector.nativeElement.contains(event.target as Node)
    ) {
      this.isDropdownOpen = false;
    }
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

  myNote(): number | null {
    const criteriaId = this.selectedCriteria?.id;
    const userId = this.currentUserId;
    if (criteriaId === undefined || userId === undefined) return null;
    return this.evaluations.find(e => e.criteriaId === criteriaId && e.teacherId === userId)?.note ?? null;
  }

  canSeeComments(): boolean {
    return this.myNote() !== null || this.evaluationsVisibility.showOtherVotes();
  }

  private noteInCell(note: number | null, cell: CellModel): boolean {
    if (note === null) return false;
    const EPS = 0.0001;
    return note >= this.cellMin(cell) - EPS && note <= cell.order + EPS;
  }

  votersForCell(cell: CellModel): EvaluationModel[] {
    const criteriaId = this.selectedCriteria?.id;
    if (criteriaId === undefined) return [];
    return this.evaluations.filter(e => e.criteriaId === criteriaId && this.noteInCell(e.note, cell));
  }

  isMyVote(cell: CellModel): boolean {
    return this.votersForCell(cell).some(v => v.teacherId === this.currentUserId);
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

  selectCell(cell: CellModel): void {
    if (this.isMyVote(cell)) {
      this.applyNote(null);
    } else {
      this.applyNote(cell.order);
    }
  }

  adjustNote(cell: CellModel, delta: number): void {
    if (!this.isMyVote(cell)) return;
    const current = this.myNote() ?? cell.order;
    const next = this.clampNote(current + delta, cell);
    if (next !== current) {
      this.applyNote(next);
    }
  }

  startEditNote(cell: CellModel): void {
    if (!this.isMyVote(cell) || this.votingCriteriaId !== null) return;
    this.editValue = this.myNote() ?? cell.order;
    this.editingNote = true;
    setTimeout(() => this.noteInputRef?.nativeElement.focus());
  }

  commitEditNote(cell: CellModel): void {
    if (this.editValue !== null && !isNaN(this.editValue)) {
      const next = this.clampNote(this.editValue, cell);
      this.applyNote(next);
    }
    this.editingNote = false;
    this.editValue = null;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private clampNote(value: number, cell: CellModel): number {
    return Math.min(cell.order, Math.max(this.cellMin(cell), this.round2(value)));
  }

  private applyNote(note: number | null): void {
    const criteria = this.selectedCriteria;
    const userId = this.currentUserId;
    if (!criteria || userId === undefined || this.votingCriteriaId !== null) return;

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

  private loadDiscussions(): void {
    const criteriaId = this.selectedCriteria?.id;
    if (criteriaId === undefined) {
      this.discussions = [];
      return;
    }

    this.loadingDiscussions = true;
    this.assessmentGridService.getCriteriaDiscussions(criteriaId, this.projectId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (discussions) => {
        this.discussions = discussions;
        this.loadingDiscussions = false;
        this.scrollDiscussionsToBottom();
      },
      error: (err) => {
        console.error('Erreur récupération des discussions:', err);
        this.loadingDiscussions = false;
      }
    });
  }

  isMyDiscussionMessage(discussion: CriteriaDiscussionModel): boolean {
    return discussion.teacherId === this.currentUserId;
  }

  sendDiscussionMessage(): void {
    const comment = this.newDiscussionMessage.trim();
    const criteriaId = this.selectedCriteria?.id;
    if (!comment || criteriaId === undefined || this.postingDiscussion) return;

    this.postingDiscussion = true;
    this.assessmentGridService.postCriteriaDiscussion(criteriaId, this.projectId, comment).subscribe({
      next: (discussion) => {
        this.discussions = [...this.discussions, discussion];
        this.newDiscussionMessage = '';
        this.postingDiscussion = false;
        this.scrollDiscussionsToBottom();
      },
      error: (err) => {
        console.error('Erreur envoi du message:', err);
        this.postingDiscussion = false;
      }
    });
  }

  private scrollDiscussionsToBottom(): void {
    setTimeout(() => {
      const el = this.discussionScrollRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  // --- Feedback (commentaire par enseignant, visible étudiant une fois la grille publiée) ---

  criteriaFeedbackCards(): EvaluationModel[] {
    const criteriaId = this.selectedCriteria?.id;
    const userId = this.currentUserId;
    if (criteriaId === undefined) return [];

    const others = this.evaluations.filter(e =>
      e.criteriaId === criteriaId && e.teacherId !== userId && !!e.commentFeedback
    );

    if (userId === undefined) return others;

    const currentUser = this.authService.getUser();
    const ownCard = this.evaluations.find(e => e.criteriaId === criteriaId && e.teacherId === userId) ?? {
      criteriaId,
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

  startEditFeedback(card: EvaluationModel): void {
    if (card.teacherId !== this.currentUserId || this.savingFeedback) return;
    this.feedbackDraft = card.commentFeedback ?? '';
    this.editingFeedback = true;
  }

  cancelEditFeedback(): void {
    this.editingFeedback = false;
    this.feedbackDraft = '';
  }

  saveFeedback(): void {
    const criteria = this.selectedCriteria;
    const userId = this.currentUserId;
    if (!criteria || userId === undefined || this.savingFeedback) return;

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
        this.editingFeedback = false;
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
      { replaceUrl }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}