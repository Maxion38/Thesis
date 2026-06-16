import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { MarkdownCardComponent } from '../../../components/markdown-card/markdown-card.component';
import { DatePickerComponent } from '../../../components/date-picker/date-picker.component';
import { WorkService } from '../../services/work.service';
import { WorkModel, WorkSubmissionModel } from '../../models/work.model';
import { AuthService } from '../../../auth/services/auth.service';
import { RoleType } from '../../../entities/role.entity';

type DisplayMode = 'original' | 'edit' | 'preview';

@Component({
  selector: 'app-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss'],
  imports: [CommonModule, FormsModule, MarkdownCardComponent, DatePickerComponent],
})
export class WorkComponent implements OnInit {
  userRole!: RoleType;
  workId!: number;
  work!: WorkModel;
  latestSubmission: WorkSubmissionModel | null = null;
  minDate!: Date;

  displayMode: DisplayMode = 'original';
  markdown = '';
  initialMarkdown = '';
  isEditing = false;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private workService: WorkService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.minDate = new Date();
    this.minDate.setHours(0, 0, 0, 0);

    this.userRole = this.authService.getFirstRole();

    this.route.paramMap.pipe(
      switchMap(params => {
        this.workId = Number(params.get('workId'));
        return this.workService.getWork(this.workId);
      }),
      tap(work => {
        this.work = work;
        this.markdown = work?.description ?? '';
        this.initialMarkdown = this.markdown;
        this.isEditing = false;
      }),
      switchMap(() => this.workService.getLatestSubmission(this.workId)),
    ).subscribe(submission => {
      this.latestSubmission = submission;
    });
  }

  // --- Display mode ---

  chooseDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
  }

  onTextChange(): void {
    this.isEditing = this.markdown !== this.initialMarkdown;
  }

  saveEdit(): void {
    this.workService.updateWork(this.workId, { description: this.markdown })
      .subscribe(() => {
        this.initialMarkdown = this.markdown;
        this.isEditing = false;
        this.displayMode = 'original';
        this.work = { ...this.work, description: this.markdown };
      });
  }

  onCancelClick(): void {
    if (this.latestSubmission) {
      this.removeSubmission();
    } else if (this.selectedFile) {
      this.selectedFile = null;
    }
  }

  cancelEdit(): void {
    this.markdown = this.initialMarkdown;
    this.isEditing = false;
    this.displayMode = 'original';
  }

  // --- Date ---

  onDateChosed(date: Date | null): void {
    this.workService.updateWork(this.workId, {
      dueDate: date ? date.toISOString() : null
    }).subscribe({
      next: () => this.work = { ...this.work, dueDate: date },
      error: (err) => console.error(err),
    });
  }

  // --- File / Submission ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  submitWork(): void {
    if (!this.selectedFile) return;

    this.workService.submitWork(this.workId, this.selectedFile).subscribe({
      next: (submission) => {
        this.latestSubmission = submission;
        this.selectedFile = null;
      },
      error: (err) => console.error(err),
    });
  }

  removeSubmission(): void {
    if (!this.latestSubmission) return;

    this.workService.removeSubmission(this.workId, this.latestSubmission.id).subscribe({
      next: () => {
        this.latestSubmission = null;
      },
      error: (err) => console.error(err),
    });
  }

  downloadFile(): void {
    if (!this.latestSubmission) return;

    this.workService.getSubmissionFile(this.workId, this.latestSubmission.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'submission.pdf';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onActionClick(fileInput: HTMLInputElement): void {
    if (this.latestSubmission) {
      this.downloadFile();
    } else if (this.selectedFile) {
      this.submitWork();
    } else {
      fileInput.click();
    }
  }

  // --- Action button getters ---

  get actionIcon(): string {
    if (this.latestSubmission) return 'download';
    if (this.selectedFile) return 'upload';
    return 'folder_open';
  }

  get actionLabel(): string {
    if (this.latestSubmission) {
      const date = new Date(this.latestSubmission.submittedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return `Rendu le ${date}`;
    }

    if (this.selectedFile) {
      return `Envoyer "${this.selectedFile.name}"`;
    }

    if (this.work?.dueDate) {
      const diffDays = Math.ceil(
        (new Date(this.work.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return diffDays >= 0
        ? `Rendre le travail (${diffDays} jours restants)`
        : `Rendre le travail en retard de ${Math.abs(diffDays)} jours`;
    }

    return 'Rendre le travail (pas de date limite)';
  }
}