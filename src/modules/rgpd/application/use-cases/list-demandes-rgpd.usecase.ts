import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListDemandesRgpdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  // userId=undefined → ADMIN, voit toutes les demandes
  execute(userId?: number) {
    return this.prisma.demandeRgpd.findMany({
      where: userId ? { userId } : {},
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { dateCreation: 'desc' },
    });
  }
}
