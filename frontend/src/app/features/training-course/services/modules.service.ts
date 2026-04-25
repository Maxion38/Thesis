import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Module } from '../models/module.model';
import { CreateModuleDto } from '../models/create-module.dto';

@Injectable({
  providedIn: 'root'
})
export class ModulesService {
  private apiUrl = 'http://localhost:3000/modules';

  constructor(private http: HttpClient) {}

  getModules() {
    return this.http.get<Module[]>(this.apiUrl);
  }

  getModulesById(id: string) {
    return this.http.get<Module>(`${this.apiUrl}/${id}`);
  }

  createModules(data: CreateModuleDto) {
    return this.http.post<Module>(this.apiUrl, data);
  }
}