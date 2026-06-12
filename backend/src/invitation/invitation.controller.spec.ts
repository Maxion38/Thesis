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
      mockInvitationService.inviteUsers.mockResolvedValue({ success: true, count: 2 });

      const dto = [
        { email: 'bob@test.com', role: RoleType.STUDENT },
        { email: 'carol@test.com', role: RoleType.TEACHER },
      ];

      const result = await controller.inviteUsers(dto as any);

      expect(mockInvitationService.inviteUsers).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Users invited successfully', count: 2 });
    });
  });

  // ── verifyActivationLink ─────────────────────────────────────────────────────

  describe('verifyActivationLink', () => {
    it('should return valid status and email when token is valid', async () => {
      mockInvitationService.verifyActivationLink.mockResolvedValue({
        email: 'bob@test.com',
      });

      const result = await controller.verifyActivationLink('fixed_token_hex');

      expect(mockInvitationService.verifyActivationLink).toHaveBeenCalledWith('fixed_token_hex');
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

      const result = await controller.activateAccount(dto as any, mockRes as any);

      expect(mockInvitationService.activateAccount).toHaveBeenCalledWith(
        dto.token, dto.surname, dto.password, dto.firstname,
      );
      // Auto-login : vérifie que le cookie JWT est posé
      expect(mockAuthService.generateToken).toHaveBeenCalledWith(mockUserDto);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'access_token',
        'mock.jwt.token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ message: 'account activated', user: mockUserDto });
    });
  });
});