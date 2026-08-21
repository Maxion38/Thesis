import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Delete, Req, Query } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { RoleType } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Auth(RoleType.COORDINATOR)
  @Post()
  create(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @Auth()
  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(+id);
  }

  @Auth()
  @Get(':projectId/overview')
  findUserModulesOverview(
    @Req() req,
    @Param('projectId') projectId: string,
  ) {
    return this.modulesService.findUserModulesOverview(
      req.user.userId,
      Number(projectId),
    );
  }

  @Auth(RoleType.COORDINATOR, RoleType.TEACHER)
  @Get('projects/:projectId/overview')
  findProjectOverview(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.modulesService.findProjectOverview(projectId);
  }

  @Auth()
  @Get(':moduleId/details')
  findModuleDetails(
    @Req() req,
    @Param('moduleId') moduleId: string,
    @Query('projectId') projectId: string,
  ) {
    return this.modulesService.findModuleDetails(
      Number(moduleId),
      req.user.userId,
      Number(projectId),
    );
  }
  
  
  @Auth(RoleType.COORDINATOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.modulesService.update(+id, updateModuleDto);
  }

  @Auth(RoleType.COORDINATOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modulesService.remove(+id);
  }
}
