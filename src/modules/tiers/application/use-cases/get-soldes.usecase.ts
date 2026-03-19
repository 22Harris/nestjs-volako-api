import { Injectable, Inject } from '@nestjs/common';
import { TIERS_REPOSITORY } from '../ports/tiers.repository.token';
import type { TiersRepository, TiersSolde } from '../ports/tiers.repository.interface';

@Injectable()
export class GetSoldesUseCase {
  constructor(@Inject(TIERS_REPOSITORY) private readonly repo: TiersRepository) {}

  execute(userId: number): Promise<TiersSolde[]> {
    return this.repo.getSoldes(userId);
  }
}
