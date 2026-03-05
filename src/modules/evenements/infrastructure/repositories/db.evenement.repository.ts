import { Injectable } from '@nestjs/common';
import { EvenementRepository } from '../../application/ports/evenement.repository.interface';
import { Evenement } from '../../domain/entities/evenement.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DbEvenementRepository implements EvenementRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(r: any): Evenement {
    return new Evenement(r.titre, r.categorie, r.montant, r.dateEcheance, r.recurrence, r.statut, r.id, r.notes ?? undefined);
  }

  findAll(): Promise<Evenement[]> {
    return this.prisma.evenement.findMany({ orderBy: { dateEcheance: 'asc' } }).then(rs => rs.map(r => this.toEntity(r)));
  }

  async findById(id: number): Promise<Evenement | null> {
    const r = await this.prisma.evenement.findUnique({ where: { id } });
    return r ? this.toEntity(r) : null;
  }

  async create(data: any): Promise<Evenement> {
    const r = await this.prisma.evenement.create({
      data: {
        titre: data.titre,
        categorie: data.categorie,
        montant: data.montant,
        dateEcheance: new Date(data.dateEcheance),
        recurrence: data.recurrence,
        statut: data.statut ?? 'EN_ATTENTE',
        notes: data.notes ?? null,
      },
    });
    return this.toEntity(r);
  }

  async update(id: number, data: any): Promise<Evenement> {
    const r = await this.prisma.evenement.update({
      where: { id },
      data: {
        ...(data.titre        && { titre: data.titre }),
        ...(data.categorie    && { categorie: data.categorie }),
        ...(data.montant      !== undefined && { montant: data.montant }),
        ...(data.dateEcheance && { dateEcheance: new Date(data.dateEcheance) }),
        ...(data.recurrence   && { recurrence: data.recurrence }),
        ...(data.statut       && { statut: data.statut }),
        ...(data.notes        !== undefined && { notes: data.notes }),
      },
    });
    return this.toEntity(r);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.evenement.delete({ where: { id } });
  }

  async marquerPaye(id: number): Promise<{ updated: Evenement; next: Evenement | null }> {
    const updated = await this.update(id, { statut: 'PAYE' });
    let next: Evenement | null = null;

    if (updated.recurrence !== 'UNIQUE') {
      const nextDate = this.nextOccurrence(updated.dateEcheance, updated.recurrence);
      next = await this.create({
        titre: updated.titre,
        categorie: updated.categorie,
        montant: updated.montant,
        dateEcheance: nextDate.toISOString().substring(0, 10),
        recurrence: updated.recurrence,
        statut: 'EN_ATTENTE',
        notes: updated.notes,
      });
    }

    return { updated, next };
  }

  private nextOccurrence(date: Date, recurrence: string): Date {
    const d = new Date(date);
    if (recurrence === 'MENSUEL')      d.setMonth(d.getMonth() + 1);
    if (recurrence === 'HEBDOMADAIRE') d.setDate(d.getDate() + 7);
    if (recurrence === 'ANNUEL')       d.setFullYear(d.getFullYear() + 1);
    return d;
  }
}
