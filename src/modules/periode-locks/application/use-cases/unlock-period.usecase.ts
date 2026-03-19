import { Inject, Injectable } from '@nestjs/common';
import { PERIODE_LOCKS } from '../ports/periode-locks.token';
import type { PeriodeLocksRepository } from '../ports/periode-locks.repository.interface';

@Injectable()
export class UnlockPeriodUseCase {
  constructor(@Inject(PERIODE_LOCKS) private readonly repo: PeriodeLocksRepository) {}
  execute(id: number, userId: number): Promise<void> {
    return this.repo.unlock(id, userId);
  }
}
