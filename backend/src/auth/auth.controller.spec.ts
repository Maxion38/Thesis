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
  issueRefreshToken: jest.fn(),
  rotateRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
};

const mockRefreshIssue = { token: 'mock.refresh.token', expiresAt: new Date(Date.now() + 1000) };

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

    it('should register, set cookies and return success message', async () => {
      mockAuthService.bootstrapRegister.mockResolvedValue(mockUserDto);
      mockAuthService.generateToken.mockReturnValue('mock.jwt.token');
      mockAuthService.issueRefreshToken.mockResolvedValue(mockRefreshIssue);

      const result = await controller.bootStrapRegister(dto as any, mockRes as any);

      expect(mockAuthService.bootstrapRegister).toHaveBeenCalledWith(
        dto.email, dto.password, dto.surname, dto.firstname,
      );
      expect(mockAuthService.generateToken).toHaveBeenCalledWith(mockUserDto);
      expect(mockAuthService.issueRefreshToken).toHaveBeenCalledWith(mockUserDto.id);
      // Vérifie que les deux cookies sont bien posés
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockRefreshIssue.token,
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

    it('should set cookies and return success message on valid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(mockUserDto);
      mockAuthService.generateToken.mockReturnValue('mock.jwt.token');
      mockAuthService.issueRefreshToken.mockResolvedValue(mockRefreshIssue);

      const result = await controller.login(dto as any, mockRes as any);

      expect(mockAuthService.issueRefreshToken).toHaveBeenCalledWith(mockUserDto.id);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockRefreshIssue.token,
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ message: 'logged in' });
    });
  });

  // ── refresh ──────────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('should throw UnauthorizedException when no refresh token cookie is present', async () => {
      const req = { cookies: {} } as any;

      await expect(controller.refresh(req, mockRes as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should rotate the token, set new cookies and return success message', async () => {
      const req = { cookies: { refresh_token: 'old.refresh.token' } } as any;
      mockAuthService.rotateRefreshToken.mockResolvedValue({
        user: mockUserDto,
        accessToken: 'new.jwt.token',
        refreshToken: 'new.refresh.token',
        refreshTokenExpiresAt: new Date(Date.now() + 1000),
      });

      const result = await controller.refresh(req, mockRes as any);

      expect(mockAuthService.rotateRefreshToken).toHaveBeenCalledWith('old.refresh.token');
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'new.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ message: 'token refreshed' });
    });

    it('should clear cookies and rethrow when rotation fails', async () => {
      const req = { cookies: { refresh_token: 'stolen.token' } } as any;
      mockAuthService.rotateRefreshToken.mockRejectedValue(new UnauthorizedException('reuse detected'));

      await expect(controller.refresh(req, mockRes as any)).rejects.toThrow(UnauthorizedException);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should revoke the refresh token, clear cookies and return success message', async () => {
      const req = { cookies: { refresh_token: 'mock.refresh.token' } } as any;

      const result = await controller.logout(req, mockRes as any);

      expect(mockAuthService.revokeRefreshToken).toHaveBeenCalledWith('mock.refresh.token');
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ message: 'logged out' });
    });

    it('should not attempt revocation when no refresh token cookie is present', async () => {
      const req = { cookies: {} } as any;

      await controller.logout(req, mockRes as any);

      expect(mockAuthService.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });
});