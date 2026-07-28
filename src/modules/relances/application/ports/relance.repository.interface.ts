import { Relance, FactureEnRetard } from '../../domain/entities/relance.entity';

export interface RelanceRepository {
  getFacturesEnRetard(userId: number): Promise<FactureEnRetard[]>;
  create(factureId: number, niveau: number, note: string | undefined, userId: number): Promise<Relance>;
  findAll(userId: number, factureId?: number): Promise<Relance[]>;
}
