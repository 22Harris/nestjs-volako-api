import { Immobilisation } from '../../domain/entities/immobilisation.entity';

export interface ImmobilisationsRepository {
  create(immo: Immobilisation, userId: number): Promise<Immobilisation>;
  findAll(userId: number): Promise<Immobilisation[]>;
  findById(id: number, userId: number): Promise<Immobilisation | null>;
  setStatutCede(id: number, dateCession: Date, prixCession: number, userId: number): Promise<void>;
  delete(id: number, userId: number): Promise<void>;
  markDotationComptabilisee(immobilisationId: number, exercice: number, journalEntryId: number): Promise<void>;
}
