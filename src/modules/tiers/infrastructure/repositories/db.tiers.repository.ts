import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TiersRepository, TiersSolde } from '../../application/ports/tiers.repository.interface';
import { Tiers } from '../../domain/entities/tiers.entity';
import { PaginatedResult, toPaginated } from '../../../../common/dto/paginated.js';

@Injectable()
export class DbTiersRepository implements TiersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(r: any): Tiers {
    return new Tiers(
      r.nom,
      r.type,
      r.id,
      r.siret ?? undefined,
      r.email ?? undefined,
      r.telephone ?? undefined,
      r.adresse ?? undefined,
      r.accountId ?? undefined,
      r.account?.code ?? undefined,
      r.account?.name ?? undefined,
    );
  }

  private include = { account: { select: { code: true, name: true } } };

  async findAll(userId: number, page = 1, pageSize = 50): Promise<PaginatedResult<Tiers>> {
    const where = { userId };
    const [rows, total] = await Promise.all([
      this.prisma.tiers.findMany({
        where,
        include: this.include,
        orderBy: { nom: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.tiers.count({ where }),
    ]);
    return toPaginated(rows.map(r => this.toEntity(r)), total, page, pageSize);
  }

  async findById(id: number, userId: number): Promise<Tiers | null> {
    const r = await this.prisma.tiers.findFirst({ where: { id, userId }, include: this.include });
    return r ? this.toEntity(r) : null;
  }

  async search(term: string, userId: number): Promise<Tiers[]> {
    const rows = await this.prisma.tiers.findMany({
      where: {
        userId,
        OR: [
          { nom: { contains: term, mode: 'insensitive' } },
          { siret: { contains: term, mode: 'insensitive' } },
        ],
      },
      include: this.include,
      take: 20,
    });
    return rows.map(r => this.toEntity(r));
  }

  async create(data: Partial<Tiers>, userId: number): Promise<Tiers> {
    const r = await this.prisma.tiers.create({
      data: {
        nom: data.nom!,
        type: data.type!,
        siret: data.siret ?? null,
        email: data.email ?? null,
        telephone: data.telephone ?? null,
        adresse: data.adresse ?? null,
        accountId: data.accountId ?? null,
        userId,
      },
      include: this.include,
    });
    return this.toEntity(r);
  }

  async update(id: number, data: Partial<Tiers>, userId: number): Promise<Tiers> {
    const r = await this.prisma.tiers.update({
      where: { id },
      data: {
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.siret !== undefined && { siret: data.siret }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.telephone !== undefined && { telephone: data.telephone }),
        ...(data.adresse !== undefined && { adresse: data.adresse }),
        ...(data.accountId !== undefined && { accountId: data.accountId }),
      },
      include: this.include,
    });
    return this.toEntity(r);
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.prisma.tiers.delete({ where: { id } });
  }

  async getSoldes(userId: number): Promise<TiersSolde[]> {
    const tiers = await this.prisma.tiers.findMany({
      where: { userId },
      include: {
        factures: {
          include: { paiements: true },
        },
      },
      orderBy: { nom: 'asc' },
    });

    return tiers.map(t => {
      const montantFacture = t.factures
        .filter(f => f.statut !== 'ANNULEE')
        .reduce((sum, f) => sum + f.montant, 0);
      const montantPaye = t.factures
        .flatMap(f => f.paiements)
        .reduce((sum, p) => sum + p.montant, 0);
      return {
        tiersId: t.id,
        nom: t.nom,
        type: t.type,
        montantFacture,
        montantPaye,
        solde: montantFacture - montantPaye,
      };
    });
  }

  async getSolde(id: number, userId: number): Promise<TiersSolde> {
    const t = await this.prisma.tiers.findFirst({
      where: { id, userId },
      include: { factures: { include: { paiements: true } } },
    });
    if (!t) throw new Error(`Tiers #${id} introuvable`);
    const montantFacture = t.factures
      .filter(f => f.statut !== 'ANNULEE')
      .reduce((sum, f) => sum + f.montant, 0);
    const montantPaye = t.factures
      .flatMap(f => f.paiements)
      .reduce((sum, p) => sum + p.montant, 0);
    return { tiersId: t.id, nom: t.nom, type: t.type, montantFacture, montantPaye, solde: montantFacture - montantPaye };
  }
}
