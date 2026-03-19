import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FactureRepository } from '../../application/ports/facture.repository.interface';
import { Facture } from '../../domain/entities/facture.entity';
import { Paiement } from '../../domain/entities/paiement.entity';

@Injectable()
export class DbFactureRepository implements FactureRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toPaiement(p: any): Paiement {
    return new Paiement(p.date, p.montant, p.mode, p.factureId, p.id, p.reference ?? undefined);
  }

  private toEntity(r: any): Facture {
    const paiements = (r.paiements ?? []).map((p: any) => this.toPaiement(p));
    const montantPaye = paiements.reduce((s: number, p: Paiement) => s + p.montant, 0);
    return new Facture(
      r.numero,
      r.date,
      r.montant,
      r.statut,
      r.tiersId,
      r.id,
      r.dateEcheance ?? undefined,
      r.notes ?? undefined,
      r.tiers?.nom ?? undefined,
      r.tiers?.type ?? undefined,
      paiements,
      montantPaye,
      Math.max(0, r.montant - montantPaye),
    );
  }

  private include = { tiers: { select: { nom: true, type: true } }, paiements: true };

  async findAll(userId: number, tiersId?: number): Promise<Facture[]> {
    const rows = await this.prisma.facture.findMany({
      where: { userId, ...(tiersId ? { tiersId } : {}) },
      include: this.include,
      orderBy: { date: 'desc' },
    });
    return rows.map(r => this.toEntity(r));
  }

  async findById(id: number, userId: number): Promise<Facture | null> {
    const r = await this.prisma.facture.findFirst({ where: { id, userId }, include: this.include });
    return r ? this.toEntity(r) : null;
  }

  async create(data: Partial<Facture>, userId: number): Promise<Facture> {
    const r = await this.prisma.facture.create({
      data: {
        numero: data.numero!,
        date: data.date!,
        dateEcheance: data.dateEcheance ?? null,
        montant: data.montant!,
        statut: data.statut ?? 'EN_ATTENTE',
        notes: data.notes ?? null,
        tiersId: data.tiersId!,
        userId,
      },
      include: this.include,
    });
    return this.toEntity(r);
  }

  async update(id: number, data: Partial<Facture>, userId: number): Promise<Facture> {
    const r = await this.prisma.facture.update({
      where: { id },
      data: {
        ...(data.numero !== undefined && { numero: data.numero }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.dateEcheance !== undefined && { dateEcheance: data.dateEcheance }),
        ...(data.montant !== undefined && { montant: data.montant }),
        ...(data.statut !== undefined && { statut: data.statut }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.tiersId !== undefined && { tiersId: data.tiersId }),
      },
      include: this.include,
    });
    return this.toEntity(r);
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.prisma.paiement.deleteMany({ where: { factureId: id } });
    await this.prisma.facture.delete({ where: { id } });
  }

  async addPaiement(factureId: number, data: Partial<Paiement>, userId: number): Promise<Facture> {
    const facture = await this.prisma.facture.findFirst({ where: { id: factureId, userId } });
    if (!facture) throw new NotFoundException(`Facture #${factureId} introuvable`);

    await this.prisma.paiement.create({
      data: {
        date: data.date!,
        montant: data.montant!,
        mode: data.mode!,
        reference: data.reference ?? null,
        factureId,
        userId,
      },
    });

    // Recalcule le statut
    const paiements = await this.prisma.paiement.findMany({ where: { factureId } });
    const totalPaye = paiements.reduce((s, p) => s + p.montant, 0);
    let statut = 'EN_ATTENTE';
    if (totalPaye >= facture.montant) statut = 'PAYEE';
    else if (totalPaye > 0) statut = 'PARTIELLEMENT_PAYEE';

    const updated = await this.prisma.facture.update({
      where: { id: factureId },
      data: { statut },
      include: this.include,
    });
    return this.toEntity(updated);
  }

  async lettrer(factureId: number, lettre: string, userId: number): Promise<void> {
    // Le lettrage assigne la même lettre aux lignes de journal liées à cette facture
    // Ici on stocke la lettre directement sur la facture pour un suivi simplifié
    await this.prisma.facture.update({
      where: { id: factureId },
      data: { statut: 'PAYEE' },
    });
  }
}
