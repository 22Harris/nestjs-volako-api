import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

const RETENTION_MIN_DAYS = 90;

@Injectable()
export class PurgerAuditLogsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(olderThanDays: number): Promise<{ deleted: number }> {
    if (olderThanDays < RETENTION_MIN_DAYS) {
      throw new BadRequestException(
        `La rétention minimale est de ${RETENTION_MIN_DAYS} jours (reçu : ${olderThanDays})`,
      );
    }
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000);
    const { count } = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return { deleted: count };
  }
}
