export class CreateWorkModel {
  name!: string;
  description!: string;
  moduleId!: number;
  maxAttempts!: number;
}

export class UpdateWorkModel {
  name?: string;
  description?: string;
  moduleId?: number;
  maxAttempts?: number;
}