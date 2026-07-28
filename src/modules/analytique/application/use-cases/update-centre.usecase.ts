import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ANALYTIQUE_REPOSITORY } from '../ports/analytique.repository.token';
import type { AnalytiqueRepository } from '../ports/analytique.repository.interface';
import type { CentreAnalytique } from '../../domain/entities/centre-analytique.entity';

@Injectable()
export class UpdateCentreAnalytiqueUseCase {
  constructor(@Inject(ANALYTIQUE_REPOSITORY) private readonly repo: AnalytiqueRepository) {}

  async execute(id: number, code: string, libelle: string, userId: number): Promise<CentreAnalytique> {
    const existing = await this.repo.findCentreById(id, userId);
    if (!existing) throw new NotFoundException(`Centre analytique #${id} introuvable`);

    if (code !== existing.code) {
      const centres = await this.repo.findAllCentres(userId);
      if (centres.some(c => c.code === code && c.id !== id)) {
        throw new ConflictException(`Le code "${code}" est déjà utilisé par un autre centre`);
      }
    }
    return this.repo.updateCentre(id, code, libelle, userId);
  }
}
