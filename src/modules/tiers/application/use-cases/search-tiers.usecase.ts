import { Injectable, Inject } from '@nestjs/common';
import { TIERS_REPOSITORY } from '../ports/tiers.repository.token';
import type { TiersRepository } from '../ports/tiers.repository.interface';
import { Tiers } from '../../domain/entities/tiers.entity';

@Injectable()
export class SearchTiersUseCase {
  constructor(@Inject(TIERS_REPOSITORY) private readonly repo: TiersRepository) {}

  execute(term: string, userId: number): Promise<Tiers[]> {
    return this.repo.search(term, userId);
  }
}
