import { CriteriaModel } from './criteria.model';
import { EvaluationModel } from './evaluation.model';
import { GridFeedbackStatus } from './grid-context.model';

export interface StudentAssessmentViewModel {
  id: number;
  name: string;
  description: string | null;
  status: GridFeedbackStatus;
  criteria: CriteriaModel[];
  evaluations: EvaluationModel[];
}
