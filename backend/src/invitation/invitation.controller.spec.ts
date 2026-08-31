import { Test, TestingModule } from '@nestjs/testing';
import { RoleType } from '@prisma/client';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { AuthService } from '../auth/auth.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockInvitationService = {
  inviteUsers: jest.fn(),
  verifyActivationLink: jest.fn(),
  activateAccount: jest.fn(),
};

const mockAuthService = {
  generateToken: jest.fn().mockReturnValue('mock.jwt.token'),
  issueRefreshToken: jest.fn().mockResolvedValue({
    token: 'mock.refresh.token',
    expiresAt: new Date(Date.now() + 1000),
  }),
};

const mockUserDto = {
  id: 1,
  email: 'bob@test.com',
  surname: 'Martin',
  firstname: 'Bob',
  roles: [RoleType.STUDENT],
};

const mockRes = {
  cookie: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('InvitationController', () => {
  let controller: InvitationController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationController],
      providers: [
        { provide: InvitationService, useValue: mockInvitationService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<InvitationController>(InvitationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── inviteUsers ──────────────────────────────────────────────────────────────

  describe('inviteUsers', () => {
    it('should call service and return success message with count', async () => {
      mockInvitationService.inviteUsers.mockResolvedValue({
        success: true,
        count: 2,
      });

      const dto = [
        { email: 'bob@test.com', role: RoleType.STUDENT },
        { email: 'carol@test.com', role: RoleType.TEACHER },
      ];

      const result = await controller.inviteUsers(dto);

      expect(mockInvitationService.inviteUsers).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        message: 'Users invited successfully',
        count: 2,
      });
    });
  });

  // ── verifyActivationLink ─────────────────────────────────────────────────────

  describe('verifyActivationLink', () => {
    it('should return valid status and email when token is valid', async () => {
      mockInvitationService.verifyActivationLink.mockResolvedValue({
        email: 'bob@test.com',
      });

      const result = await controller.verifyActivationLink('fixed_token_hex');

      expect(mockInvitationService.verifyActivationLink).toHaveBeenCalledWith(
        'fixed_token_hex',
      );
      expect(result).toEqual({ valid: true, email: 'bob@test.com' });
    });
  });

  // ── activateAccount ──────────────────────────────────────────────────────────

  describe('activateAccount', () => {
    const dto = {
      token: 'fixed_token_hex',
      surname: 'Martin',
      password: 'pass',
      firstname: 'Bob',
    };

    it('should activate account, set cookie and return user', async () => {
      mockInvitationService.activateAccount.mockResolvedValue(mockUserDto);

      const result = await controller.activateAccount(dto, mockRes as any);

      expect(mockInvitationService.activateAccount).toHaveBeenCalledWith(
        dto.token,
        dto.surname,
        dto.password,
        dto.firstname,
      );
      // Auto-login : vérifie que les cookies JWT + refresh sont posés
      expect(mockAuthService.generateToken).toHaveBeenCalledWith(mockUserDto);
      expect(mockAuthService.issueRefreshToken).toHaveBeenCalledWith(
        mockUserDto.id,
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'mock.refresh.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        message: 'account activated',
        user: mockUserDto,
      });
    });
  });
});
