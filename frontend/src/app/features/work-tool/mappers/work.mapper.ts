import { CreateWorkModel, UpdateWorkModel } from "../models/work.model";

export function mapCreateWork(dto: any): CreateWorkModel {
  return { ...dto };
}

export function mapUpdateWork(dto: any): UpdateWorkModel {
  return { ...dto };
}