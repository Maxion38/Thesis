import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockAuthService = {
  getCurrentUser: jest.fn(),
  isBootstrapEnabled: jest.fn(),
  bootstrapRegister: jest.fn(),
  validateUser: jest.fn(),
  generateToken: jest.fn(),
};

const mockUserDto = {
  id: 1,
  email: 'alice@test.com',
  surname: 'Dupont',
  firstname: 'Alice',
  roles: [RoleType.COORDINATOR],
};

// Simule l'objet Response Express avec les méthodes cookie
const mockRes = {
  cookie: jest.fn(),
  clearCookie: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── getMe ────────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('should call service.getCurrentUser with userId from request', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUserDto);

      const result = await controller.getMe({ user: { userId: 1 } });

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUserDto);
    });
  });

  // ── isBootStrapEnabled ───────────────────────────────────────────────────────

  describe('isBootStrapEnabled', () => {
    it('should return true when bootstrap is enabled', async () => {
      mockAuthService.isBootstrapEnabled.mockResolvedValue(true);

      const result = await controller.isBootStrapEnabled();

      expect(result).toBe(true);
    });

    it('should return false when bootstrap is already completed', async () => {
      mockAuthService.isBootstrapEnabled.mockResolvedValue(false);

      const result = await controller.isBootStrapEnabled();

      expect(result).toBe(false);
    });
  });

  // ── bootStrapRegister ────────────────────────────────────────────────────────

  describe('bootStrapRegister', () => {
    const dto = {
      email: 'alice@test.com',
      password: 'pass',
      surname: 'Dupont',
      firstname: 'Alice',
    };

    it('should register, set cookie and return success message', async () => {
      mockAuthService.bootstrapRegister.mockResolvedValue(mockUserDto);
      mockAuthService.generateToken.mockReturnValue('mock.jwt.token');

      const result = await controller.bootStrapRegister(dto as any, mockRes as any);

      expect(mockAuthService.bootstrapRegister).toHaveBeenCalledWith(
        dto.email, dto.password, dto.surname, dto.firstname,
      );
      expect(mockAuthService.generateToken).toHaveBeenCalledWith(mockUserDto);
      // Vérifie que le cookie JWT est bien posé
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ message: 'bootstrap completed' });
    });
  });

  // ── login ────────────────────────────────────────────────────────────────────

  describe('login', () => {
    const dto = { email: 'alice@test.com', password: 'pass' };

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        controller.login(dto as any, mockRes as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should set cookie and return success message on valid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(mockUserDto);
      mockAuthService.generateToken.mockReturnValue('mock.jwt.token');

      const result = await controller.login(dto as any, mockRes as any);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ message: 'logged in' });
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear cookie and return success message', () => {
      const result = controller.logout(mockRes as any);

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ message: 'logged out' });
    });
  });
});