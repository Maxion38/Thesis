import { 
  Controller, 
  Get,
  Post, 
  Body,
  Res,
  Query,
} from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { AuthService } from '../auth/auth.service';
import type { Response } from 'express';
import { UserToInviteDto } from './dto/user-to-invite.dto';
import { ActivateAccountDto } from './dto/activateAccount.dto';
import { RoleType } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { setAuthCookies } from '../auth/utils/auth-cookies.util';


@Controller('invitation')
export class InvitationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly authSerivce: AuthService,
  ) {}

  @Auth(RoleType.COORDINATOR)
  @Post('inviteUsers')
  async inviteUsers(
    @Body() dto: UserToInviteDto[],
  ) {
    const result = await this.invitationService.inviteUsers(
      dto,
    );

    return {
      message: 'Users invited successfully',
      count: result.count,
    };
  }

  @Get('verifyActivationLink')
  async verifyActivationLink(@Query('token') token: string) {
    const invitation = await this.invitationService.verifyActivationLink(token);

    return {
      valid: true,
      email: invitation.email,
    };
  }

  @Post('activateAccount')
  async activateAccount(
    @Body() dto: ActivateAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.invitationService.activateAccount(
      dto.token,
      dto.surname,
      dto.password,
      dto.firstname, 
    )

    // auto login after register
    const accessToken = this.authSerivce.generateToken(user);
    const { token: refreshToken, expiresAt } = await this.authSerivce.issueRefreshToken(user.id);

    setAuthCookies(res, accessToken, refreshToken, expiresAt);

    return {
      message: 'account activated',
      user,
    };
  }
}
