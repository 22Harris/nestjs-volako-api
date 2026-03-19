import { Injectable, Inject } from '@nestjs/common';
import { FACTURE_REPOSITORY } from '../ports/facture.repository.token';
import type { FactureRepository } from '../ports/facture.repository.interface';

@Injectable()
export class LettrerUseCase {
  constructor(@Inject(FACTURE_REPOSITORY) private readonly repo: FactureRepository) {}

  execute(factureId: number, lettre: string, userId: number): Promise<void> {
    return this.repo.lettrer(factureId, lettre, userId);
  }
}
