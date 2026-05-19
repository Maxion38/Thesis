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
import { Role } from './entities/role.entity';
import { Auth } from '../auth/decorators/auth.decorator';


@Controller('invitation')
export class InvitationController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly authSerivce: AuthService,
  ) {}

  @Auth(Role.COORDINATOR)
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
    console.log('DTO reçu:', dto);

    const user = await this.invitationService.activateAccount(
      dto.token,
      dto.surname,
      dto.password,
      dto.firstname, 
    )

    // auto login after register
    const token = this.authSerivce.generateToken(user);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false, // TODO true in prod /!\ 
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return {
      message: 'account activated',
      user,
    };
  }
}
