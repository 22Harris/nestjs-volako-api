import type {
  CentreAnalytique,
  AffectationLigne,
  LigneAnalytique,
  BalanceCentre,
} from '../../domain/entities/centre-analytique.entity';

export interface AnalytiqueRepository {
  createCentre(code: string, libelle: string, userId: number): Promise<CentreAnalytique>;
  findAllCentres(userId: number): Promise<CentreAnalytique[]>;
  findCentreById(id: number, userId: number): Promise<CentreAnalytique | null>;
  updateCentre(id: number, code: string, libelle: string, userId: number): Promise<CentreAnalytique>;
  deleteCentre(id: number, userId: number): Promise<void>;

  affecter(journalLineId: number, affectations: AffectationLigne[]): Promise<LigneAnalytique[]>;
  getAffectations(journalLineId: number): Promise<LigneAnalytique[]>;

  getBalance(userId: number, dateFrom?: Date, dateTo?: Date): Promise<BalanceCentre[]>;
}
