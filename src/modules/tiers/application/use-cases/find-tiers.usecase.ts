import { Injectable, Inject } from '@nestjs/common';
import { TIERS_REPOSITORY } from '../ports/tiers.repository.token';
import type { TiersRepository } from '../ports/tiers.repository.interface';
import { PaginatedResult } from '../../../../common/dto/paginated.js';
import { Tiers } from '../../domain/entities/tiers.entity';

@Injectable()
export class FindTiersUseCase {
  constructor(@Inject(TIERS_REPOSITORY) private readonly repo: TiersRepository) {}

  execute(userId: number, page?: number, pageSize?: number): Promise<PaginatedResult<Tiers>> {
    return this.repo.findAll(userId, page, pageSize);
  }
}
