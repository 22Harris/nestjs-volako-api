import { Injectable } from '@nestjs/common';
import { ObjectifRepository } from '../../application/ports/objectif.repository.interface';
import { Objectif } from '../../domain/entities/objectif.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DbObjectifRepository implements ObjectifRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(r: any): Objectif {
    return new Objectif(r.nom, r.categorie, r.montantCible, r.montantActuel, r.dateDebut, r.dateEcheance, r.couleur, r.icone, r.statut, r.id, r.description ?? undefined);
  }

  findAll(userId: number) { return this.prisma.objectif.findMany({ where: { userId } }).then(rs => rs.map(r => this.toEntity(r))); }

  async findById(id: number, userId: number) {
    const r = await this.prisma.objectif.findFirst({ where: { id, userId } });
    return r ? this.toEntity(r) : null;
  }

  async create(data: any, userId: number) {
    const r = await this.prisma.objectif.create({ data: {
      nom: data.nom, description: data.description ?? null, categorie: data.categorie,
      montantCible: data.montantCible, montantActuel: data.montantActuel ?? 0,
      dateDebut: new Date(data.dateDebut), dateEcheance: new Date(data.dateEcheance),
      couleur: data.couleur, icone: data.icone, statut: data.statut ?? 'EN_COURS',
      userId,
    }});
    return this.toEntity(r);
  }

  async update(id: number, data: any, userId: number) {
    const d: any = {};
    if (data.nom !== undefined) d.nom = data.nom;
    if (data.description !== undefined) d.description = data.description;
    if (data.categorie !== undefined) d.categorie = data.categorie;
    if (data.montantCible !== undefined) d.montantCible = data.montantCible;
    if (data.montantActuel !== undefined) d.montantActuel = data.montantActuel;
    if (data.dateDebut !== undefined) d.dateDebut = new Date(data.dateDebut);
    if (data.dateEcheance !== undefined) d.dateEcheance = new Date(data.dateEcheance);
    if (data.couleur !== undefined) d.couleur = data.couleur;
    if (data.icone !== undefined) d.icone = data.icone;
    if (data.statut !== undefined) d.statut = data.statut;
    const r = await this.prisma.objectif.update({ where: { id, userId }, data: d });
    return this.toEntity(r);
  }

  async delete(id: number, userId: number) { await this.prisma.objectif.delete({ where: { id, userId } }); }

  async versement(id: number, montant: number, userId: number) {
    const current = await this.prisma.objectif.findFirst({ where: { id, userId } });
    const newMontant = (current?.montantActuel ?? 0) + montant;
    const newStatut = newMontant >= (current?.montantCible ?? 0) ? 'ATTEINT' : current?.statut;
    const r = await this.prisma.objectif.update({ where: { id, userId }, data: { montantActuel: newMontant, statut: newStatut } });
    return this.toEntity(r);
  }
}
