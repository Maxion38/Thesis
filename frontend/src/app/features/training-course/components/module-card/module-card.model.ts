export interface ModuleCard {
  title: string;
  conditions?: Condition[];
  id: number;
}

export interface Condition {
  type: 'access' | 'success';
  method: 'uservalidation' | 'supervisorvalidation' | 'toolsubmission' | 'date';
  value: string | string | string | Date;
}