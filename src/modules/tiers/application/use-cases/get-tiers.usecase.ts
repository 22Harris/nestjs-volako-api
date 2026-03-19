import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TIERS_REPOSITORY } from '../ports/tiers.repository.token';
import type { TiersRepository } from '../ports/tiers.repository.interface';
import { Tiers } from '../../domain/entities/tiers.entity';

@Injectable()
export class GetTiersUseCase {
  constructor(@Inject(TIERS_REPOSITORY) private readonly repo: TiersRepository) {}

  async execute(id: number, userId: number): Promise<Tiers> {
    const tiers = await this.repo.findById(id, userId);
    if (!tiers) throw new NotFoundException(`Tiers #${id} introuvable`);
    return tiers;
  }
}
