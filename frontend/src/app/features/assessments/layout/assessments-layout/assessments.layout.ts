import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router';
import { AssessmentGridService } from '../../services/assessments.service';
import { StudentWithGridsModel, GridSummaryModel } from '../../models/students-grids-id.model';

@Component({
  selector: 'app-assessments-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './assessments.layout.html',
  styleUrls: ['./assessments.layout.scss'],
})
export class AssessmentsLayoutComponent implements OnInit {
  showUserOptions = false;
  showGridOptions = false;

  students!: StudentWithGridsModel[];
  selectedStudent?: StudentWithGridsModel;
  selectedGrid?: GridSummaryModel;

  constructor(
    private assessmentGridService: AssessmentGridService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const routeUserId = Number(this.route.snapshot.paramMap.get('userId'));
    const routeGridId = Number(this.route.snapshot.paramMap.get('assessmentId'));

    this.assessmentGridService.getStudentsWithGrids().subscribe(students => {
      this.students = students;

      this.selectedStudent =
        students.find(student => student.id === routeUserId) ?? students[0];

      this.selectedGrid =
        this.selectedStudent?.grids.find(grid => grid.id === routeGridId) ??
        this.selectedStudent?.grids[0];

      // Si l'URL initiale ne pointait pas déjà vers cet utilisateur/cette
      // grille (route '' au chargement, ou id invalide), on la met à jour
      // pour qu'elle reflète toujours la sélection courante.
      if (
        this.selectedStudent &&
        this.selectedGrid &&
        (this.selectedStudent.id !== routeUserId || this.selectedGrid.id !== routeGridId)
      ) {
        this.navigateTo(this.selectedStudent.id, this.selectedGrid.id, true);
      }
    });
  }

  selectStudent(student: StudentWithGridsModel): void {
    this.selectedStudent = student;
    this.selectedGrid = student.grids[0];
    this.showUserOptions = false;

    if (this.selectedGrid) {
      this.navigateTo(student.id, this.selectedGrid.id);
    }
  }

  selectGrid(grid: GridSummaryModel): void {
    this.selectedGrid = grid;
    this.showGridOptions = false;

    if (this.selectedStudent) {
      this.navigateTo(this.selectedStudent.id, grid.id);
    }
  }

  private navigateTo(userId: number, gridId: number, replaceUrl = false): void {
    this.router.navigate(['/teacher', 'assessments', userId, gridId], { replaceUrl });
  }

  getInitials(student: StudentWithGridsModel): string {
    const firstName = student.firstname || '';
    const lastName = student.surname || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
}