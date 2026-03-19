import { Inject, Injectable } from '@nestjs/common';
import { PERIODE_LOCKS } from '../ports/periode-locks.token';
import type { PeriodeLocksRepository } from '../ports/periode-locks.repository.interface';
import { PeriodeLock } from '../../domain/entities/periode-lock.entity';

@Injectable()
export class FindPeriodeLocksUseCase {
  constructor(@Inject(PERIODE_LOCKS) private readonly repo: PeriodeLocksRepository) {}
  execute(userId: number): Promise<PeriodeLock[]> {
    return this.repo.findAll(userId);
  }
}
