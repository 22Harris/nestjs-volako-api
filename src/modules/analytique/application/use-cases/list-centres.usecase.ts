import { Inject, Injectable } from '@nestjs/common';
import { ANALYTIQUE_REPOSITORY } from '../ports/analytique.repository.token';
import type { AnalytiqueRepository } from '../ports/analytique.repository.interface';
import type { CentreAnalytique } from '../../domain/entities/centre-analytique.entity';

@Injectable()
export class ListCentresAnalytiquesUseCase {
  constructor(@Inject(ANALYTIQUE_REPOSITORY) private readonly repo: AnalytiqueRepository) {}

  execute(userId: number): Promise<CentreAnalytique[]> {
    return this.repo.findAllCentres(userId);
  }
}
