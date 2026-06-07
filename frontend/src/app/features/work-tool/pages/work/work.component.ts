import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { MarkdownCardComponent } from '../../../components/markdown-card/markdown-card.component';
import { DatePickerComponent } from '../../../components/date-picker/date-picker.component';
import { WorkService } from '../../services/work.service';
import { WorkModel } from '../../models/work.model';

type DisplayMode = 'original' | 'edit' | 'preview';

@Component({
  selector: 'app-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss'],
  imports: [CommonModule, FormsModule, MarkdownCardComponent, DatePickerComponent],
})
export class WorkComponent {

  displayMode: DisplayMode = 'original';

  markdown = '';
  initialMarkdown = '';

  isEditing = false;
  workId!: number;

  private refresh$ = new BehaviorSubject<void>(undefined);

  workData$!: Observable<WorkModel>;

  constructor(
    private route: ActivatedRoute,
    private workService: WorkService,
  ) {}

  ngOnInit(): void {
    this.workData$ = this.route.paramMap.pipe(
      map(params => Number(params.get('workId'))),
      tap(workId => this.workId = workId),
      switchMap(workId => this.refresh$.pipe(
        switchMap(() => this.workService.getWork(workId))
      )),
      tap(work => {
        this.markdown = work?.description ?? '';
        this.initialMarkdown = this.markdown;
        this.checkIfEditing();
      })
    );
  }

  chooseDisplayMode(mode: DisplayMode) {
    this.displayMode = mode;
  }

  onTextChange() {
    this.checkIfEditing();
  }

  checkIfEditing() {
    this.isEditing = this.markdown !== this.initialMarkdown;
  }

  saveEdit() {
    this.workService.updateWork(this.workId, {
      description: this.markdown
    }).subscribe(() => {
      this.refresh$.next();
      this.displayMode = 'original';
    });
  }

  cancelEdit() {
    this.markdown = this.initialMarkdown;
    this.displayMode = 'original';
    this.checkIfEditing();
  }

  onDateChosed(date: Date | null): void {
    this.workService.updateWork(this.workId, {
      dueDate: date ? date.toISOString() : null
    }).subscribe({
      next: () => this.refresh$.next(),
      error: (err) => console.log(err)
    });
  }
}