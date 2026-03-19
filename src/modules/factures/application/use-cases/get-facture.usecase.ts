import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FACTURE_REPOSITORY } from '../ports/facture.repository.token';
import type { FactureRepository } from '../ports/facture.repository.interface';
import { Facture } from '../../domain/entities/facture.entity';

@Injectable()
export class GetFactureUseCase {
  constructor(@Inject(FACTURE_REPOSITORY) private readonly repo: FactureRepository) {}

  async execute(id: number, userId: number): Promise<Facture> {
    const f = await this.repo.findById(id, userId);
    if (!f) throw new NotFoundException(`Facture #${id} introuvable`);
    return f;
  }
}
