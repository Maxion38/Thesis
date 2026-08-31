import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { InvitationService } from './invitation.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';
import { mockPrismaService } from '../../prisma/prisma.service.mock';

// ─── Mock crypto ──────────────────────────────────────────────────────────────
// On fixe le token généré pour rendre les assertions déterministes

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('fixed_token_hex'),
  }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockInvitation = {
  id: 1,
  email: 'bob@test.com',
  role: RoleType.STUDENT,
  token: 'fixed_token_hex',
  used: false,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // dans 1h
};

const mockUserDto = {
  id: 1,
  email: 'bob@test.com',
  surname: 'Martin',
  firstname: 'Bob',
  roles: [RoleType.STUDENT],
};

const mockEmailService = {
  sendInvitation: jest.fn().mockResolvedValue(undefined),
};

const mockAuthService = {
  register: jest.fn(),
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('InvitationService', () => {
  let service: InvitationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<InvitationService>(InvitationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── inviteUsers ──────────────────────────────────────────────────────────────

  describe('inviteUsers', () => {
    const usersToInvite = [{ email: 'bob@test.com', role: RoleType.STUDENT }];

    it('should throw ConflictException when user already exists', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { email: 'bob@test.com' },
      ]);

      await expect(service.inviteUsers(usersToInvite)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when invitation already sent', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.invitation.findMany.mockResolvedValue([
        { email: 'bob@test.com' },
      ]);

      await expect(service.inviteUsers(usersToInvite)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create invitation and send email for each user', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.invitation.findMany.mockResolvedValue([]);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitation);

      const result = await service.inviteUsers(usersToInvite);

      expect(mockPrismaService.invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'bob@test.com',
            role: RoleType.STUDENT,
            token: 'fixed_token_hex',
            used: false,
          }),
        }),
      );
      expect(mockEmailService.sendInvitation).toHaveBeenCalledWith(
        'bob@test.com',
        'fixed_token_hex',
      );
      expect(result).toEqual({ success: true, count: 1 });
    });

    it('should handle batch invitations and return correct count', async () => {
      const batch = [
        { email: 'bob@test.com', role: RoleType.STUDENT },
        { email: 'carol@test.com', role: RoleType.TEACHER },
      ];
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.invitation.findMany.mockResolvedValue([]);
      mockPrismaService.invitation.create.mockResolvedValue(mockInvitation);

      const result = await service.inviteUsers(batch);

      expect(mockPrismaService.invitation.create).toHaveBeenCalledTimes(2);
      expect(mockEmailService.sendInvitation).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true, count: 2 });
    });
  });

  // ── verifyActivationLink ─────────────────────────────────────────────────────

  describe('verifyActivationLink', () => {
    it('should throw NotFoundException when token does not exist', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(null);

      await expect(service.verifyActivationLink('bad_token')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when invitation already used', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        used: true,
      });

      await expect(
        service.verifyActivationLink('fixed_token_hex'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw GoneException when invitation has expired', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue({
        ...mockInvitation,
        expiresAt: new Date(Date.now() - 1000), // expiré
      });

      await expect(
        service.verifyActivationLink('fixed_token_hex'),
      ).rejects.toThrow(GoneException);
    });

    it('should return invitation when token is valid', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(mockInvitation);

      const result = await service.verifyActivationLink('fixed_token_hex');

      expect(result).toEqual(mockInvitation);
    });
  });

  // ── activateAccount ──────────────────────────────────────────────────────────

  describe('activateAccount', () => {
    it('should propagate exceptions from verifyActivationLink', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(null);

      await expect(
        service.activateAccount('bad_token', 'Martin', 'pass'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should register user with invitation email and role', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(mockInvitation);
      mockAuthService.register.mockResolvedValue(mockUserDto);
      mockPrismaService.invitation.update.mockResolvedValue({
        ...mockInvitation,
        used: true,
      });

      const result = await service.activateAccount(
        'fixed_token_hex',
        'Martin',
        'pass',
        'Bob',
      );

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'bob@test.com',
        'pass',
        'Martin',
        RoleType.STUDENT,
        'Bob',
      );
      expect(result).toEqual(mockUserDto);
    });

    it('should mark invitation as used after successful registration', async () => {
      mockPrismaService.invitation.findUnique.mockResolvedValue(mockInvitation);
      mockAuthService.register.mockResolvedValue(mockUserDto);
      mockPrismaService.invitation.update.mockResolvedValue({
        ...mockInvitation,
        used: true,
      });

      await service.activateAccount('fixed_token_hex', 'Martin', 'pass');

      expect(mockPrismaService.invitation.update).toHaveBeenCalledWith({
        where: { token: 'fixed_token_hex' },
        data: { used: true },
      });
    });
  });
});
