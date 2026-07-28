import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ANALYTIQUE_REPOSITORY } from '../ports/analytique.repository.token';
import type { AnalytiqueRepository } from '../ports/analytique.repository.interface';
import type { CentreAnalytique } from '../../domain/entities/centre-analytique.entity';

@Injectable()
export class CreateCentreAnalytiqueUseCase {
  constructor(@Inject(ANALYTIQUE_REPOSITORY) private readonly repo: AnalytiqueRepository) {}

  async execute(code: string, libelle: string, userId: number): Promise<CentreAnalytique> {
    const centres = await this.repo.findAllCentres(userId);
    if (centres.some(c => c.code === code)) {
      throw new ConflictException(`Un centre analytique avec le code "${code}" existe déjà`);
    }
    return this.repo.createCentre(code, libelle, userId);
  }
}
