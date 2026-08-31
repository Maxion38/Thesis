import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RoleType } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock';

// ─── Mock bcrypt ──────────────────────────────────────────────────────────────

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUserWithRoles = {
  id: 1,
  email: 'alice@test.com',
  surname: 'Dupont',
  firstname: 'Alice',
  passwordHash: 'hashed_password',
  roles: [{ role: { role: RoleType.COORDINATOR } }],
};

const mockUserDto = {
  id: 1,
  email: 'alice@test.com',
  surname: 'Dupont',
  firstname: 'Alice',
  roles: [RoleType.COORDINATOR],
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── isBootstrapEnabled ───────────────────────────────────────────────────────

  describe('isBootstrapEnabled', () => {
    it('should return true when no coordinator exists', async () => {
      mockPrismaService.user.count.mockResolvedValue(0);

      const result = await service.isBootstrapEnabled();

      expect(result).toBe(true);
    });

    it('should return false when at least one coordinator exists', async () => {
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.isBootstrapEnabled();

      expect(result).toBe(false);
    });
  });

  // ── bootstrapRegister ────────────────────────────────────────────────────────

  describe('bootstrapRegister', () => {
    it('should throw ForbiddenException when bootstrap already completed', async () => {
      mockPrismaService.user.count.mockResolvedValue(1); // coordinator exists
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.bootstrapRegister('alice@test.com', 'pass', 'Dupont', 'Alice'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should call register with COORDINATOR role when bootstrap enabled', async () => {
      mockPrismaService.user.count.mockResolvedValue(0); // no coordinator
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUserWithRoles);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.bootstrapRegister(
        'alice@test.com',
        'pass',
        'Dupont',
        'Alice',
      );

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            roles: {
              create: {
                role: { connect: { role: RoleType.COORDINATOR } },
              },
            },
          }),
        }),
      );
      expect(result).toMatchObject({
        email: 'alice@test.com',
        roles: [RoleType.COORDINATOR],
      });
    });
  });

  // ── register ─────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('should throw ConflictException when email already in use', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithRoles);

      await expect(
        service.register('alice@test.com', 'pass', 'Dupont', RoleType.STUDENT),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password and create user with given role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUserWithRoles,
        roles: [{ role: { role: RoleType.STUDENT } }],
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      await service.register(
        'alice@test.com',
        'pass',
        'Dupont',
        RoleType.STUDENT,
        'Alice',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'alice@test.com',
            passwordHash: 'hashed_password',
            surname: 'Dupont',
            firstname: 'Alice',
          }),
        }),
      );
    });

    it('should return a mapped UserDto', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUserWithRoles);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.register(
        'alice@test.com',
        'pass',
        'Dupont',
        RoleType.COORDINATOR,
      );

      expect(result).toEqual(mockUserDto);
    });
  });

  // ── validateUser ─────────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('should return null when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('unknown@test.com', 'pass');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithRoles);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('alice@test.com', 'wrong_pass');

      expect(result).toBeNull();
    });

    it('should return mapped UserDto when credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithRoles);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'alice@test.com',
        'correct_pass',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correct_pass',
        'hashed_password',
      );
      expect(result).toEqual(mockUserDto);
    });
  });

  // ── getCurrentUser ───────────────────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentUser(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return mapped UserDto for existing user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithRoles);

      const result = await service.getCurrentUser(1);

      expect(result).toEqual(mockUserDto);
    });
  });

  // ── generateToken ────────────────────────────────────────────────────────────

  describe('generateToken', () => {
    it('should call jwtService.sign with correct payload', () => {
      const result = service.generateToken(mockUserDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'alice@test.com',
        roles: [RoleType.COORDINATOR],
      });
      expect(result).toBe('mock.jwt.token');
    });
  });

  // ── issueRefreshToken ────────────────────────────────────────────────────────

  describe('issueRefreshToken', () => {
    it('should create a hashed refresh token in DB and return the raw token', async () => {
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.issueRefreshToken(1);

      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 1,
            familyId: expect.any(String),
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
      expect(result.token).toEqual(expect.any(String));
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should reuse the given familyId when provided (rotation)', async () => {
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.issueRefreshToken(1, 'family-123');

      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ familyId: 'family-123' }),
        }),
      );
    });
  });

  // ── rotateRefreshToken ───────────────────────────────────────────────────────

  describe('rotateRefreshToken', () => {
    const storedToken = {
      id: 10,
      userId: 1,
      familyId: 'family-123',
      tokenHash: 'irrelevant-in-test',
      revokedAt: null as Date | null,
      expiresAt: new Date(Date.now() + 100000),
    };

    it('should throw UnauthorizedException when token is not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.rotateRefreshToken('unknown')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should revoke the whole family and throw when a revoked token is replayed', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...storedToken,
        revokedAt: new Date(),
      });
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      await expect(service.rotateRefreshToken('stolen')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { familyId: 'family-123', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException when the token has expired', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        ...storedToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.rotateRefreshToken('expired')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should revoke the presented token and issue a new one in the same family', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(storedToken);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithRoles);
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.rotateRefreshToken('valid');

      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { revokedAt: expect.any(Date) },
      });
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ familyId: 'family-123' }),
        }),
      );
      expect(result.user).toEqual(mockUserDto);
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toEqual(expect.any(String));
    });
  });

  // ── revokeRefreshToken ───────────────────────────────────────────────────────

  describe('revokeRefreshToken', () => {
    it('should mark the matching non-revoked token as revoked', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeRefreshToken('some-token');

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: expect.any(String), revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
