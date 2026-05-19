export interface ModuleModel {
  id: number;
  name: string;
  description?: string;
  trainingCourseId?: number;
  conditions?: ConditionsModel[];  
}

export interface ConditionsModel {
  id: number;
  type: 'ACCESS' | 'SUCCESS';
  method: 'USER_VALIDATION' | 'SUPERVISOR_VALIDATION' | 'TOOL_SUBMISSION' | 'DATE';
  operator?: 'AND' | 'OR';
  date?: Date;
  supervisorValidation?: boolean;
  validatorId?: number;
  toolId?: number;
}
