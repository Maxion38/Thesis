import { CreateWorkModel, UpdateWorkModel, WorkModel } from "../models/work.model";

export function mapWork(data: any): WorkModel {
  return {
    id: data.id,
    name: data.tool.name,
    description: data.tool.description,
    moduleId: data.tool.moduleId,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    maxAttempts: data.maxAttempts,
  };
}

export function mapCreateWork(dto: any): CreateWorkModel {
  return { ...dto };
}

export function mapUpdateWork(dto: any): UpdateWorkModel {
  return { ...dto };
}