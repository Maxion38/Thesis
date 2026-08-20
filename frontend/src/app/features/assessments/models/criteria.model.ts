import { CellModel } from './cell.model';

export interface CriteriaModel {
  id: number;
  name: string;
  order: number;
  defaultWeight: number;
  cells: CellModel[];
}