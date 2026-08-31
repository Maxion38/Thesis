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
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { BootStrapRegisterDto } from './dto/bootstrapRegister.dto';
import { Auth } from './decorators/auth.decorator';
import { setAuthCookies, clearAuthCookies } from './utils/auth-cookies.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @Auth()
  async getMe(@Req() req: any) {
    return this.authService.getCurrentUser(req.user.userId);
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

    const accessToken = this.authService.generateToken(user);
    const { token: refreshToken, expiresAt } = await this.authService.issueRefreshToken(user.id);

    setAuthCookies(res, accessToken, refreshToken, expiresAt);

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

    const accessToken = this.authService.generateToken(user);
    const { token: refreshToken, expiresAt } = await this.authService.issueRefreshToken(user.id);

    setAuthCookies(res, accessToken, refreshToken, expiresAt);

    return { message: 'logged in' };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.['refresh_token'];

    if (!rawToken) {
      throw new UnauthorizedException('No refresh token');
    }

    try {
      const { accessToken, refreshToken, refreshTokenExpiresAt } =
        await this.authService.rotateRefreshToken(rawToken);

      setAuthCookies(res, accessToken, refreshToken, refreshTokenExpiresAt);

      return { message: 'token refreshed' };
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.['refresh_token'];

    if (rawToken) {
      await this.authService.revokeRefreshToken(rawToken);
    }

    clearAuthCookies(res);

    return { message: 'logged out' };
  }
}
