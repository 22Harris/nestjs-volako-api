import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type StatutDemande = 'TRAITEE' | 'REFUSEE';

@Injectable()
export class TraiterDemandeRgpdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: number, statut: StatutDemande, note?: string) {
    const demande = await this.prisma.demandeRgpd.findUnique({ where: { id } });
    if (!demande) throw new NotFoundException(`Demande RGPD #${id} introuvable`);
    if (demande.statut !== 'EN_ATTENTE') {
      throw new BadRequestException(`La demande est déjà "${demande.statut}"`);
    }
    return this.prisma.demandeRgpd.update({
      where: { id },
      data: { statut, dateTraitement: new Date(), note: note ?? demande.note },
    });
  }
}
