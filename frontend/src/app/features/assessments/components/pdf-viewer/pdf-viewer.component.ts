import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { WorkService } from '../../../work-tool/services/work.service';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
})
export class PdfViewerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) workId!: number;
  @Input({ required: true }) submissionId!: number;
  @Input() fileName: string | null = null;

  loading = false;
  error = false;
  safeUrl: SafeResourceUrl | null = null;

  private objectUrl: string | null = null;

  constructor(
    private workService: WorkService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workId'] || changes['submissionId']) {
      this.loadFile();
    }
  }

  private loadFile(): void {
    this.revokeObjectUrl();
    this.safeUrl = null;
    this.error = false;

    if (!this.workId || !this.submissionId) return;

    this.loading = true;
    this.workService.getSubmissionFile(this.workId, this.submissionId).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement du PDF:', err);
        this.error = true;
        this.loading = false;
      },
    });
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }
}
