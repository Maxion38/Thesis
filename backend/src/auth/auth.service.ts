import { Injectable, ConflictException, ForbiddenException, NotFoundException, GoneException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RoleType } from '@prisma/client';
import { toDtoUser } from 'src/users/mappers/user.mapper';
import { UserDto } from 'src/users/dto/user.dto';
import { USER_WITH_ROLES } from 'src/users/includes/users.include';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async isBootstrapEnabled() {
    const coordinatorsNumber = await this.prisma.user.count({
      where: {
        roles: {
          some: {
            role: {
              role: RoleType.COORDINATOR,
            }
          },
        },
      },
    });

    return coordinatorsNumber === 0;
  }

  async bootstrapRegister(email: string, password: string, surname: string, firstname?: string) {
    const bootstrapEnabled = await this.isBootstrapEnabled();
    
    if (!bootstrapEnabled) {
      throw new ForbiddenException('Bootstrap already completed');
    }

    return this.register(
      email,
      password,
      surname,
      RoleType.COORDINATOR,
      firstname,
    )
  }

  async register(email: string, password: string, surname: string, role: RoleType, firstname?: string) {
    // 1. is user allready in DB
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // 2. hashing password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        surname,
        firstname,

        roles: {
          create: {
            role: {
              connect: {
                role: role,
              },
            },
          },
        },
      },
      include: USER_WITH_ROLES,
    });

    // 4. return user
    return toDtoUser(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: USER_WITH_ROLES,
    });

    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) return null;

    return toDtoUser(user);
  }

  generateToken(user: UserDto) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.sign(payload);
  }
}