import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { PERIODE_LOCKS } from '../ports/periode-locks.token';
import type { PeriodeLocksRepository } from '../ports/periode-locks.repository.interface';
import { PeriodeLock } from '../../domain/entities/periode-lock.entity';

@Injectable()
export class LockPeriodUseCase {
  constructor(@Inject(PERIODE_LOCKS) private readonly repo: PeriodeLocksRepository) {}

  async execute(annee: number, mois: number, userId: number): Promise<PeriodeLock> {
    const already = await this.repo.isLocked(annee, mois, userId);
    if (already) throw new ConflictException(`La période ${mois}/${annee} est déjà verrouillée`);
    return this.repo.lock(annee, mois, userId);
  }
}
