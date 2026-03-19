import { PeriodeLock } from '../../domain/entities/periode-lock.entity';

export interface PeriodeLocksRepository {
  findAll(userId: number): Promise<PeriodeLock[]>;
  isLocked(annee: number, mois: number, userId: number): Promise<boolean>;
  lock(annee: number, mois: number, userId: number): Promise<PeriodeLock>;
  unlock(id: number, userId: number): Promise<void>;
}
