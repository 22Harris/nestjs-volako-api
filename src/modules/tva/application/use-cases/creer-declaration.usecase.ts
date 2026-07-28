import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TvaService } from '../../tva.service';

@Injectable()
export class CreerDeclarationTvaUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tvaService: TvaService,
  ) {}

  async execute(userId: number, dateFrom: string, dateTo: string, periode: string) {
    if (new Date(dateFrom) > new Date(dateTo)) {
      throw new BadRequestException('dateFrom doit être antérieure à dateTo');
    }

    const ca3 = await this.tvaService.getCa3(userId, dateFrom, dateTo);

    return this.prisma.declarationTva.create({
      data: {
        periode,
        dateDebut: new Date(dateFrom),
        dateFin: new Date(dateTo),
        statut: 'BROUILLON',
        tvaAPayer: ca3.tvaAPayer,
        creditTva: ca3.creditTva,
        donnees: ca3 as any,
        userId,
      },
    });
  }
}
