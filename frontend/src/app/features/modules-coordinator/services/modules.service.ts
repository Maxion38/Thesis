import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { ModuleModel } from '../models/module.model';
import { CreateModuleDto } from '../models/create-module.dto';
import { ModuleOverviewModel } from '../../modules-student/model/module-overview.model';
import { mapModuleOverview } from '../../modules-student/mappers/module-overview.mapper';

@Injectable({
  providedIn: 'root'
})
export class ModulesService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/modules';

  getAll(): Observable<ModuleModel[]> {
    return this.http.get<ModuleModel[]>(
      this.apiUrl,
      { withCredentials: true }
    );
  }

  getModules(): Observable<ModuleModel[]> {
    return this.http.get<ModuleModel[]>(
      this.apiUrl,
      { withCredentials: true }
    );
  }

  getProjectModulesOverview(projectId: number): Observable<ModuleOverviewModel[]> {
    return this.http.get<ModuleOverviewModel[]>(
      `${this.apiUrl}/${projectId}/overview`,
      { withCredentials: true }
    ).pipe(
      map(dtos => dtos.map(mapModuleOverview))
    );
  }

  getModulesById(id: number): Observable<ModuleModel> {
    return this.http.get<ModuleModel>(
      `${this.apiUrl}/${id}`,
      { withCredentials: true }
    );
  }

  update(id: number, data: Partial<ModuleModel>): Observable<ModuleModel> {
    return this.http.patch<ModuleModel>(
      `${this.apiUrl}/${id}`, 
      data,
      { withCredentials: true }
    );
  }

  create(data: CreateModuleDto): Observable<ModuleModel> {
    return this.http.post<ModuleModel>(
      this.apiUrl, 
      data,
      { withCredentials: true }
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { withCredentials: true }
    );
  }
}