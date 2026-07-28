import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ANALYTIQUE_REPOSITORY } from '../ports/analytique.repository.token';
import type { AnalytiqueRepository } from '../ports/analytique.repository.interface';
import type { AffectationLigne, LigneAnalytique } from '../../domain/entities/centre-analytique.entity';

@Injectable()
export class AffecterLignesAnalytiquesUseCase {
  constructor(@Inject(ANALYTIQUE_REPOSITORY) private readonly repo: AnalytiqueRepository) {}

  async execute(
    journalLineId: number,
    affectations: AffectationLigne[],
    userId: number,
  ): Promise<LigneAnalytique[]> {
    if (affectations.length === 0) {
      throw new BadRequestException('Au moins une affectation est requise');
    }

    const total = affectations.reduce((s, a) => s + a.pourcentage, 0);
    if (total !== 100) {
      throw new BadRequestException(
        `La somme des pourcentages doit être égale à 100 (reçu : ${total})`,
      );
    }

    if (affectations.some(a => a.pourcentage <= 0 || a.pourcentage > 100)) {
      throw new BadRequestException('Chaque pourcentage doit être compris entre 1 et 100');
    }

    // Vérifie que tous les centres appartiennent au user
    for (const a of affectations) {
      const centre = await this.repo.findCentreById(a.centreId, userId);
      if (!centre) {
        throw new NotFoundException(`Centre analytique #${a.centreId} introuvable`);
      }
    }

    return this.repo.affecter(journalLineId, affectations);
  }
}
