export interface GridSummaryModel {
  id: number;
  name: string;
}

export interface ProjectMemberModel {
  id: number;
  firstname: string | null;
  surname: string;
}

export interface ProjectWithGridsModel {
  id: number;
  title: string | null;
  students: ProjectMemberModel[];
  grids: GridSummaryModel[];
  worksSubmitted: number;
  worksTotal: number;
}
