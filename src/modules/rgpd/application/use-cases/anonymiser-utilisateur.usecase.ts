import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AnonymiserUtilisateurUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(targetUserId: number, requestingUserId: number): Promise<{ message: string }> {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException(`Utilisateur #${targetUserId} introuvable`);

    // Un admin ne peut pas s'auto-anonymiser
    if (targetUserId === requestingUserId) {
      throw new ForbiddenException("Impossible d'anonymiser son propre compte");
    }

    // Génère un mot de passe aléatoire inaccessible (l'utilisateur ne pourra plus se connecter)
    const randomPwd = await bcrypt.hash(Math.random().toString(36) + Date.now(), 12);

    await this.prisma.$transaction([
      // Anonymise les données personnelles de l'utilisateur
      this.prisma.user.update({
        where: { id: targetUserId },
        data: {
          name: `Anonymise_${targetUserId}`,
          email: `deleted_${targetUserId}@anonyme.local`,
          password: randomPwd,
          twoFactorSecret: null,
          twoFactorEnabled: false,
          isActive: false,
        },
      }),
      // Révoque tous les refresh tokens
      this.prisma.refreshToken.deleteMany({ where: { userId: targetUserId } }),
      // Anonymise les tiers liés (données potentiellement personnelles)
      this.prisma.tiers.updateMany({
        where: { userId: targetUserId },
        data: { email: null, telephone: null, adresse: null },
      }),
    ]);

    return {
      message: `Utilisateur #${targetUserId} anonymisé avec succès. Les données comptables sont conservées conformément aux obligations légales (10 ans).`,
    };
  }
}
