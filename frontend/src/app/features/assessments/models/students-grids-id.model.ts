export interface GridSummaryModel {
  id: number;
  name: string;
}

export interface StudentWithGridsModel {
  id: number;
  firstname: string | null;
  surname: string;
  grids: GridSummaryModel[];
}