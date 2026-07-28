import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListDeclarationsTvaUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(userId: number) {
    return this.prisma.declarationTva.findMany({
      where: { userId },
      select: {
        id: true, periode: true, dateDebut: true, dateFin: true,
        statut: true, tvaAPayer: true, creditTva: true,
        dateCreation: true, dateSoumission: true,
      },
      orderBy: { dateDebut: 'desc' },
    });
  }
}
