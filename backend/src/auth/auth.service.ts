import { Injectable, ConflictException, ForbiddenException, NotFoundException, GoneException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './entities/role.entity';


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async isBootstrapEnabled() {
    const coordinatorsNumber = await this.prisma.user.count({
      where : { role: Role.COORDINATOR },
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
      Role.COORDINATOR,
      firstname,
    )
  }

  async register(email: string, password: string, surname: string, role, firstname?: string) {
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
        role,
      },
    });

    // 4. return user
    return {
      id: user.id,
      email: user.email,
      surname: user.surname,
      role: user.role,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) return null;

    return user;
  }

  generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}