import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FiscalYearRepository } from '../../application/ports/fiscal-year.repository.interface';
import { FiscalYear, FiscalYearStatus } from '../../domain/entities/fiscal-year.entity';

@Injectable()
export class DbFiscalYearRepository implements FiscalYearRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(row: any): FiscalYear {
    return new FiscalYear(
      row.annee,
      row.statut as FiscalYearStatus,
      row.userId,
      row.createdAt,
      row.id,
      row.closedAt ?? undefined,
    );
  }

  async create(annee: number, userId: number): Promise<FiscalYear> {
    const row = await this.prisma.fiscalYear.create({ data: { annee, userId } });
    return this.toEntity(row);
  }

  async findAll(userId: number): Promise<FiscalYear[]> {
    const rows = await this.prisma.fiscalYear.findMany({
      where: { userId },
      orderBy: { annee: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findByAnnee(annee: number, userId: number): Promise<FiscalYear | null> {
    const row = await this.prisma.fiscalYear.findUnique({
      where: { annee_userId: { annee, userId } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findById(id: number, userId: number): Promise<FiscalYear | null> {
    const row = await this.prisma.fiscalYear.findFirst({ where: { id, userId } });
    return row ? this.toEntity(row) : null;
  }

  async close(annee: number, userId: number): Promise<FiscalYear> {
    const row = await this.prisma.fiscalYear.update({
      where: { annee_userId: { annee, userId } },
      data: { statut: 'CLOTURE', closedAt: new Date() },
    });
    return this.toEntity(row);
  }
}
