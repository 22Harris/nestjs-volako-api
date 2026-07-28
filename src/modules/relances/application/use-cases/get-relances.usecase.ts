import { Inject, Injectable } from '@nestjs/common';
import type { RelanceRepository } from '../ports/relance.repository.interface';
import { RELANCE_REPOSITORY } from '../ports/relance.repository.token';
import type { Relance } from '../../domain/entities/relance.entity';

@Injectable()
export class GetRelancesUseCase {
  constructor(@Inject(RELANCE_REPOSITORY) private readonly repo: RelanceRepository) {}

  execute(userId: number, factureId?: number): Promise<Relance[]> {
    return this.repo.findAll(userId, factureId);
  }
}
