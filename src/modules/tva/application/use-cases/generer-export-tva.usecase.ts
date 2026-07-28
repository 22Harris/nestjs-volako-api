import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateCa3Xml } from '../utils/ca3-xml.generator';
import type { Ca3Report } from '../../tva.service';

@Injectable()
export class GenererExportTvaUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: number, userId: number): Promise<{ xml: string; filename: string }> {
    const decl = await this.prisma.declarationTva.findFirst({ where: { id, userId } });
    if (!decl) throw new NotFoundException(`Déclaration TVA #${id} introuvable`);

    const xml = generateCa3Xml(decl.donnees as unknown as Ca3Report, decl.periode, userId);
    const filename = `CA3_${decl.periode}_${id}.xml`;
    return { xml, filename };
  }
}
