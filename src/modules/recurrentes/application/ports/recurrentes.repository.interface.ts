import type { EcritureRecurrente, LigneRecurrenteData, Frequence } from '../../domain/entities/ecriture-recurrente.entity';

export interface CreateRecurrenteData {
  label: string;
  frequence: Frequence;
  prochainExecution: Date;
  actif?: boolean;
  journalId?: number;
  lignes: LigneRecurrenteData[];
}

export interface UpdateRecurrenteData {
  label?: string;
  frequence?: Frequence;
  prochainExecution?: Date;
  actif?: boolean;
  journalId?: number;
  lignes?: LigneRecurrenteData[];
}

export interface RecurrentesRepository {
  create(data: CreateRecurrenteData, userId: number): Promise<EcritureRecurrente>;
  findAll(userId: number): Promise<EcritureRecurrente[]>;
  findById(id: number, userId: number): Promise<EcritureRecurrente | null>;
  update(id: number, data: UpdateRecurrenteData, userId: number): Promise<EcritureRecurrente>;
  delete(id: number, userId: number): Promise<void>;
  /** Retourne les écritures actives dont prochainExecution <= now pour tous les users. */
  findDues(): Promise<EcritureRecurrente[]>;
  /** Met à jour prochainExecution après exécution. */
  updateNextExecution(id: number, next: Date): Promise<void>;
}
