import { FiscalYear } from '../../domain/entities/fiscal-year.entity';

export interface FiscalYearRepository {
  create(annee: number, userId: number): Promise<FiscalYear>;
  findAll(userId: number): Promise<FiscalYear[]>;
  findByAnnee(annee: number, userId: number): Promise<FiscalYear | null>;
  findById(id: number, userId: number): Promise<FiscalYear | null>;
  close(annee: number, userId: number): Promise<FiscalYear>;
}
