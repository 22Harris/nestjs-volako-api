import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { LoginUseCase } from '../application/use-cases/login.usecase';
import { RegisterUseCase } from '../application/use-cases/register.usecase';
import { RefreshUseCase } from '../application/use-cases/refresh.usecase';
import { LogoutUseCase } from '../application/use-cases/logout.usecase';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
  ) {
    const result = await this.loginUseCase.execute(dto.email, dto.password, req.ip);
    res.cookie('access_token', result.access_token, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', result.refresh_token, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { user: result.user };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
  ) {
    const result = await this.registerUseCase.execute(dto.name, dto.email, dto.password, req.ip);
    res.cookie('access_token', result.access_token, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', result.refresh_token, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('Refresh token manquant');
    const result = await this.refreshUseCase.execute(refreshToken);
    res.cookie('access_token', result.access_token, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (refreshToken) await this.logoutUseCase.execute(refreshToken);
    res.clearCookie('access_token', COOKIE_BASE);
    res.clearCookie('refresh_token', COOKIE_BASE);
    return { ok: true };
  }
}
