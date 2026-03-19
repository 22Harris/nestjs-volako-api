import { Injectable, Inject } from '@nestjs/common';
import { TIERS_REPOSITORY } from '../ports/tiers.repository.token';
import type { TiersRepository } from '../ports/tiers.repository.interface';

@Injectable()
export class DeleteTiersUseCase {
  constructor(@Inject(TIERS_REPOSITORY) private readonly repo: TiersRepository) {}

  execute(id: number, userId: number): Promise<void> {
    return this.repo.delete(id, userId);
  }
}
