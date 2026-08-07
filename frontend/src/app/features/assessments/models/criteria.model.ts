import { CellModel } from './cell.model';

export interface CriteriaModel {
  name: string;
  order: number;
  defaultWeight: number;
  cells: CellModel[];
}