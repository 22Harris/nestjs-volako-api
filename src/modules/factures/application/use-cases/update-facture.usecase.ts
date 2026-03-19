import { Injectable, Inject } from '@nestjs/common';
import { FACTURE_REPOSITORY } from '../ports/facture.repository.token';
import type { FactureRepository } from '../ports/facture.repository.interface';
import { Facture } from '../../domain/entities/facture.entity';

@Injectable()
export class UpdateFactureUseCase {
  constructor(@Inject(FACTURE_REPOSITORY) private readonly repo: FactureRepository) {}

  execute(id: number, data: Partial<Facture>, userId: number): Promise<Facture> {
    return this.repo.update(id, data, userId);
  }
}
