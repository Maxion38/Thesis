export class CellDto {
  description!: string;
  order!: number;
  weight!: number | null;
}

export class CriteriaDto {
  name!: string;
  order!: number;
  defaultWeight!: number;
  cells!: CellDto[];
}

export class GridSummaryDto {
  id!: number;
  name!: string;
}

export class StudentWithGridsDto {
  id!: number;
  firstname!: string | null;
  surname!: string;
  grids!: GridSummaryDto[];
}