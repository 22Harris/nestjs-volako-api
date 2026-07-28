import { Inject, Injectable } from '@nestjs/common';
import type { RelanceRepository } from '../ports/relance.repository.interface';
import { RELANCE_REPOSITORY } from '../ports/relance.repository.token';
import type { FactureEnRetard } from '../../domain/entities/relance.entity';

@Injectable()
export class GetFacturesEnRetardUseCase {
  constructor(@Inject(RELANCE_REPOSITORY) private readonly repo: RelanceRepository) {}

  execute(userId: number): Promise<FactureEnRetard[]> {
    return this.repo.getFacturesEnRetard(userId);
  }
}
