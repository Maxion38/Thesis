import { ConditionModel, ModuleToolGroupModel } from './module-overview.model';

// A card is a single tool, or a pair of linked tools (eg. a WORK linked
// to its grading ASSESSMENT), grouped under the module they belong to.
export interface StudentToolCardModel {
  id: string;
  moduleId: number;
  moduleName: string;
  locked: boolean;
  lockedBy?: ConditionModel[];
  tools: ModuleToolGroupModel[];
}
