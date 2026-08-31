import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';
import { RoleType } from '@prisma/client';

export function Auth(...roles: RoleType[]) {
  const decorators = [UseGuards(JwtAuthGuard, RolesGuard)];

  if (roles.length > 0) {
    decorators.push(Roles(...roles));
  }

  return applyDecorators(...decorators);
}
