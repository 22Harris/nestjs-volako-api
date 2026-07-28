import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { generateSecret, generateURI } from 'otplib';
import * as QRCode from 'qrcode';
import { AUTH_REPOSITORY } from '../ports/auth.repository.token';
import type { AuthRepository } from '../ports/auth.repository.interface';
import { Role } from 'src/common/enums/role.enum';

const ALLOWED_ROLES = new Set<Role>([Role.ADMIN, Role.DAF]);

@Injectable()
export class Setup2faUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repo: AuthRepository,
  ) {}

  async execute(userId: number): Promise<{ otpauthUrl: string; qrCodeDataUrl: string; secret: string }> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (!ALLOWED_ROLES.has(user.role)) {
      throw new ForbiddenException('La 2FA est réservée aux rôles ADMIN et DAF');
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: 'Volako', label: user.email, secret });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await this.repo.setTwoFactorSecret(userId, secret);

    return { otpauthUrl, qrCodeDataUrl, secret };
  }
}
