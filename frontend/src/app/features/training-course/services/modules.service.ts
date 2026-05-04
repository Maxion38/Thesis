import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ModuleModel } from '../models/module.model';
import { CreateModuleDto } from '../models/create-module.dto';

@Injectable({
  providedIn: 'root'
})
export class ModulesService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/modules';

  getAll(): Observable<ModuleModel[]> {
    return this.http.get<ModuleModel[]>(this.apiUrl);
  }

  getModules(): Observable<ModuleModel[]> {
    return this.http.get<ModuleModel[]>(this.apiUrl);
  }

  getModulesById(id: number): Observable<ModuleModel> {
    return this.http.get<ModuleModel>(`${this.apiUrl}/${id}`);
  }

  createModules(data: CreateModuleDto): Observable<ModuleModel> {
    return this.http.post<ModuleModel>(this.apiUrl, data);
  }
}