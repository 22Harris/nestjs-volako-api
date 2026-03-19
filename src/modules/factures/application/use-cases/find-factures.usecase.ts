import { Injectable, Inject } from '@nestjs/common';
import { FACTURE_REPOSITORY } from '../ports/facture.repository.token';
import type { FactureRepository } from '../ports/facture.repository.interface';
import { Facture } from '../../domain/entities/facture.entity';

@Injectable()
export class FindFacturesUseCase {
  constructor(@Inject(FACTURE_REPOSITORY) private readonly repo: FactureRepository) {}

  execute(userId: number, tiersId?: number): Promise<Facture[]> {
    return this.repo.findAll(userId, tiersId);
  }
}
