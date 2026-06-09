import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { switchMap, map, tap } from 'rxjs/operators';
import { WorkService } from '../../services/work.service';
import { WorkSubmissionModel } from '../../models/work.model';


@Component({
  selector: 'app-submissions',
  templateUrl: './submissions.component.html',
  styleUrls: ['./submissions.component.scss'],
  imports: [CommonModule],
})
export class SubmissionComponent implements OnInit {
  userId!: number;
  submissions! : WorkSubmissionModel[] | null;

  constructor(
    private route: ActivatedRoute,
    private workService: WorkService
  ) {}

  ngOnInit(): void {
    const parent = this.route.parent;
    if (!parent) return;

    parent.paramMap.pipe(
      map(params => Number(params.get('userId'))),
      tap(id => this.userId = id),
      switchMap(id => this.workService.getUserSubmissions(id)),
    ).subscribe(submissions => {
      this.submissions = submissions;
    });
  }

  downloadSubmission(submission: WorkSubmissionModel): void {
    const workId = submission.work.id;
    const submissionId = submission.id;

    this.workService.getSubmissionFile(workId, submissionId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submission_${submissionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }, err => console.error(err));
  }
}