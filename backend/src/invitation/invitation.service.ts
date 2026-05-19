import { ConflictException, ForbiddenException, NotFoundException, GoneException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';
import { UserToInviteDto } from './dto/user-to-invite.dto';

@Injectable()
export class InvitationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private authService: AuthService,
  ) {}

  async inviteUsers(users: UserToInviteDto[]) {
    const emails = users.map(u => u.email);

    const existingUsers = await this.prisma.user.findMany({
      where: {
        email: { in: emails },
      },
      select: { email: true },
    });

    if (existingUsers.length > 0) {
      throw new ConflictException(
        `Users already exist: ${existingUsers.map(u => u.email).join(', ')}`
      );
    }

    const existingInvitations = await this.prisma.invitation.findMany({
      where: {
        email: { in: emails },
        used: false,
      },
      select: { email: true },
    });

    if (existingInvitations.length > 0) {
      throw new ConflictException(
        `Invitations already sent: ${existingInvitations.map(i => i.email).join(', ')}`
      );
    }

    // batch creation
    const invitations = await Promise.all(
      users.map(async (user) => {
        const token = crypto.randomBytes(32).toString('hex');

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const invitation = await this.prisma.invitation.create({
          data: {
            email: user.email,
            role: user.role,
            token,
            used: false,
            expiresAt,
          },
        });

        await this.emailService.sendInvitation(user.email, token);

        return invitation;
      }),
    );

    return {
      success: true,
      count: invitations.length,
    };
  }


  async verifyActivationLink(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException("User not invited");
    }

    if (invitation.used) {
      throw new ForbiddenException('Invitation already used');
    }

    if (invitation.expiresAt < new Date()) {
      throw new GoneException('Invitation has expired');
    }

    return invitation;    
  }

  
  async activateAccount(
    token: string, 
    surname: string, 
    password: string, 
    firstname?: string
  ) {
    const invitation = await this.verifyActivationLink(token);

    const user = await this.authService.register(
      invitation.email, 
      password, 
      surname, 
      invitation.role, 
      firstname
    );

    await this.prisma.invitation.update({
      where: { token },
      data: { used: true },
    })

    return user;
  }
}
