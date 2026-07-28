import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SoumettreDeclarationTvaUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: number, userId: number) {
    const decl = await this.prisma.declarationTva.findFirst({ where: { id, userId } });
    if (!decl) throw new NotFoundException(`Déclaration TVA #${id} introuvable`);
    if (decl.statut !== 'BROUILLON') {
      throw new BadRequestException(`La déclaration est déjà "${decl.statut}" et ne peut plus être soumise`);
    }
    return this.prisma.declarationTva.update({
      where: { id },
      data: { statut: 'SOUMISE', dateSoumission: new Date() },
    });
  }
}
