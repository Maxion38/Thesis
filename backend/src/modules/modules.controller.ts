import { Controller, Get, Post, Body } from '@nestjs/common';
import { ModulesService } from './modules.service';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @Post()
  create(@Body() data: { name: string }) {
    return this.modulesService.create(data);
  } 
}
