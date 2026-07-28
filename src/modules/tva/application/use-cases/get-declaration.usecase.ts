import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GetDeclarationTvaUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: number, userId: number) {
    const decl = await this.prisma.declarationTva.findFirst({ where: { id, userId } });
    if (!decl) throw new NotFoundException(`Déclaration TVA #${id} introuvable`);
    return decl;
  }
}
