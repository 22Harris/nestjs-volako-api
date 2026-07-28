import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompanyInfoRepository } from '../../application/ports/company-info.repository.interface';
import { CompanyInfo } from '../../domain/entities/company-info.entity';

@Injectable()
export class DbCompanyInfoRepository implements CompanyInfoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(row: any): CompanyInfo {
    return new CompanyInfo(
      row.nom,
      row.id,
      row.userId,
      row.siret ?? undefined,
      row.numTva ?? undefined,
      row.adresse ?? undefined,
      row.email ?? undefined,
      row.iban ?? undefined,
    );
  }

  async findByUser(userId: number): Promise<CompanyInfo | null> {
    const row = await this.prisma.companyInfo.findUnique({ where: { userId } });
    if (!row) return null;
    return this.toEntity(row);
  }

  async upsert(data: CompanyInfo, userId: number): Promise<CompanyInfo> {
    const row = await this.prisma.companyInfo.upsert({
      where: { userId },
      create: {
        userId,
        nom: data.nom,
        siret: data.siret ?? null,
        numTva: data.numTva ?? null,
        adresse: data.adresse ?? null,
        email: data.email ?? null,
        iban: data.iban ?? null,
      },
      update: {
        nom: data.nom,
        siret: data.siret ?? null,
        numTva: data.numTva ?? null,
        adresse: data.adresse ?? null,
        email: data.email ?? null,
        iban: data.iban ?? null,
      },
    });
    return this.toEntity(row);
  }
}
