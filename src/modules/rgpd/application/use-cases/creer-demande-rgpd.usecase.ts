import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type TypeDemande = 'ACCES' | 'EFFACEMENT' | 'PORTABILITE' | 'RECTIFICATION';

@Injectable()
export class CreerDemandeRgpdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(userId: number, type: TypeDemande, note?: string) {
    return this.prisma.demandeRgpd.create({
      data: { userId, type, note: note ?? null, statut: 'EN_ATTENTE' },
    });
  }
}
