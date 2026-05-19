import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { BootStrapRegisterDto } from './dto/bootstrapRegister.dto';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @Auth()
  getMe(@Req() req: any) {
    return req.user;
  }


  @Get('bootstrap-status')
  async isBootStrapEnabled() {
    return await this.authService.isBootstrapEnabled();
  }


  @Post('bootstrap-register')
  async bootStrapRegister(
    @Body() dto: BootStrapRegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.bootstrapRegister(
      dto.email,
      dto.password,
      dto.surname,
      dto.firstname,
    );

    const token = this.authService.generateToken(user);

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return { message: 'bootstrap completed' };
  }


  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(
      dto.email,
      dto.password,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    const token = this.authService.generateToken(user);

    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // true in prod (HTTPS)
      maxAge: 1000 * 60 * 60 * 24,
    });

    return { message: 'logged in' };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // true in prod (HTTPS)
    });

    return { message: 'logged out' };
  }
}
