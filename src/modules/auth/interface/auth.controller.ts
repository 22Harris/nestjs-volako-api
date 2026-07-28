import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { SetupAdminDto } from './dtos/setup-admin.dto';
import { LoginUseCase } from '../application/use-cases/login.usecase';
import { RegisterUseCase } from '../application/use-cases/register.usecase';
import { RefreshUseCase } from '../application/use-cases/refresh.usecase';
import { LogoutUseCase } from '../application/use-cases/logout.usecase';
import { SetupAdminUseCase } from '../application/use-cases/setup_admin.usecase';
import { UpdateProfileUseCase } from '../application/use-cases/update-profile.usecase';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.usecase';
import { Setup2faUseCase } from '../application/use-cases/setup-2fa.usecase';
import { Enable2faUseCase } from '../application/use-cases/enable-2fa.usecase';
import { Disable2faUseCase } from '../application/use-cases/disable-2fa.usecase';
import { Verify2faUseCase } from '../application/use-cases/verify-2fa.usecase';
import { AUTH_REPOSITORY } from '../application/ports/auth.repository.token';
import type { AuthRepository } from '../application/ports/auth.repository.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly setupAdminUseCase: SetupAdminUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly setup2faUseCase: Setup2faUseCase,
    private readonly enable2faUseCase: Enable2faUseCase,
    private readonly disable2faUseCase: Disable2faUseCase,
    private readonly verify2faUseCase: Verify2faUseCase,
    private readonly jwtService: JwtService,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepository,
  ) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Récupérer le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getMe(@CurrentUser() userId: number) {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  async setup(
    @Body() dto: SetupAdminDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const result = await this.setupAdminUseCase.execute(dto);
    res.cookie('access_token', result.access_token, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Connexion — pose les cookies httpOnly access_token et refresh_token' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
    @Req() req: express.Request,
  ) {
    const result = await this.loginUseCase.execute(dto.email, dto.password, req.ip);
    if (result.requires2fa) {
      // Cookie temp_token httpOnly 5 min — le frontend n'a qu'à appeler /auth/2fa/verify
      res.cookie('temp_token', result.temp_token, { ...COOKIE_BASE, maxAge: 5 * 60 * 1000 });
      return { requires2fa: true };
    }
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
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès via le cookie refresh_token' })
  @ApiResponse({ status: 200, description: 'Token rafraîchi' })
  @ApiResponse({ status: 401, description: 'Refresh token manquant ou expiré' })
  async refresh(@Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('Refresh token manquant');
    const result = await this.refreshUseCase.execute(refreshToken);
    res.cookie('access_token', result.access_token, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déconnexion — efface les cookies et invalide le refresh token' })
  @ApiResponse({ status: 200, description: 'Déconnecté' })
  async logout(@Req() req: express.Request, @Res({ passthrough: true }) res: express.Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (refreshToken) await this.logoutUseCase.execute(refreshToken);
    res.clearCookie('access_token', COOKIE_BASE);
    res.clearCookie('refresh_token', COOKIE_BASE);
    return { ok: true };
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() userId: number,
    @Body() body: { name: string; email: string },
  ) {
    return this.updateProfileUseCase.execute(userId, body.name, body.email);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() userId: number,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.changePasswordUseCase.execute(userId, body.currentPassword, body.newPassword);
  }

  // ── 2FA ──────────────────────────────────────────────────────────────────────

  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Générer le secret TOTP et le QR code (ADMIN / DAF)' })
  setup2fa(@CurrentUser() userId: number) {
    return this.setup2faUseCase.execute(userId);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Activer la 2FA après vérification du premier code TOTP' })
  enable2fa(
    @CurrentUser() userId: number,
    @Body() body: { code: string },
  ) {
    return this.enable2faUseCase.execute(userId, body.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Désactiver la 2FA avec un code TOTP valide' })
  disable2fa(
    @CurrentUser() userId: number,
    @Body() body: { code: string },
  ) {
    return this.disable2faUseCase.execute(userId, body.code);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier le code TOTP après login (échange le temp_token contre les vrais cookies)' })
  async verify2fa(
    @Body() body: { code: string },
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const tempToken = req.cookies?.['temp_token'];
    if (!tempToken) throw new UnauthorizedException('Token temporaire manquant');

    let payload: any;
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Token temporaire invalide ou expiré');
    }

    if (!payload?.twoFactorPending) throw new UnauthorizedException('Token temporaire invalide');

    const result = await this.verify2faUseCase.execute(payload.sub, body.code, req.ip);
    res.clearCookie('temp_token', COOKIE_BASE);
    res.cookie('access_token', result.access_token, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', result.refresh_token, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { user: result.user };
  }
}
