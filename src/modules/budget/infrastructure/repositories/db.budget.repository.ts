import { Injectable } from '@nestjs/common';
import { BudgetRepository } from '../../application/ports/budget.repository.interface';
import { Budget, BudgetLigne } from '../../domain/entities/budget.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DbBudgetRepository implements BudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(r: any): Budget {
    return new Budget(
      r.exercice, r.mois,
      (r.lignes ?? []).map((l: any) => new BudgetLigne(l.categorie, l.libelle, l.montantPrevu, l.type, l.budgetId, l.id)),
      r.id,
    );
  }

  private async findWithLignes(id: number, userId: number): Promise<Budget> {
    const r = await this.prisma.budget.findFirst({ where: { id, userId }, include: { lignes: true } });
    return this.toEntity(r!);
  }

  findAll(userId: number): Promise<Budget[]> {
    return this.prisma.budget.findMany({ where: { userId }, include: { lignes: true }, orderBy: [{ exercice: 'desc' }, { mois: 'desc' }] })
      .then(rs => rs.map(r => this.toEntity(r)));
  }

  async findByMois(exercice: number, mois: number, userId: number): Promise<Budget | null> {
    const r = await this.prisma.budget.findFirst({ where: { exercice, mois, userId }, include: { lignes: true } });
    return r ? this.toEntity(r) : null;
  }

  async create(exercice: number, mois: number, userId: number): Promise<Budget> {
    const r = await this.prisma.budget.create({ data: { exercice, mois, userId }, include: { lignes: true } });
    return this.toEntity(r);
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.prisma.budgetLigne.deleteMany({ where: { budgetId: id } });
    await this.prisma.budget.delete({ where: { id, userId } });
  }

  async saveLigne(budgetId: number, ligne: any, userId: number): Promise<Budget> {
    if (ligne.id) {
      await this.prisma.budgetLigne.update({
        where: { id: ligne.id },
        data: { categorie: ligne.categorie, libelle: ligne.libelle, montantPrevu: ligne.montantPrevu, type: ligne.type },
      });
    } else {
      await this.prisma.budgetLigne.create({
        data: { budgetId, categorie: ligne.categorie, libelle: ligne.libelle, montantPrevu: ligne.montantPrevu, type: ligne.type },
      });
    }
    return this.findWithLignes(budgetId, userId);
  }

  async deleteLigne(budgetId: number, ligneId: number, userId: number): Promise<Budget> {
    await this.prisma.budgetLigne.delete({ where: { id: ligneId } });
    return this.findWithLignes(budgetId, userId);
  }
}
