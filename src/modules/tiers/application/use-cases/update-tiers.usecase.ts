import { Injectable, Inject } from '@nestjs/common';
import { TIERS_REPOSITORY } from '../ports/tiers.repository.token';
import type { TiersRepository } from '../ports/tiers.repository.interface';
import { Tiers } from '../../domain/entities/tiers.entity';

@Injectable()
export class UpdateTiersUseCase {
  constructor(@Inject(TIERS_REPOSITORY) private readonly repo: TiersRepository) {}

  execute(id: number, data: Partial<Tiers>, userId: number): Promise<Tiers> {
    return this.repo.update(id, data, userId);
  }
}
