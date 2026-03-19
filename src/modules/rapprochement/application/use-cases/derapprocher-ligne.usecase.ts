import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RAPPROCHEMENT_REPOSITORY } from '../ports/rapprochement.repository.token';
import type { RapprochementRepository } from '../ports/rapprochement.repository.interface';

@Injectable()
export class DerapprocherLigneUseCase {
  constructor(
    @Inject(RAPPROCHEMENT_REPOSITORY)
    private readonly repo: RapprochementRepository,
  ) {}

  async execute(ligneId: number) {
    const ligne = await this.repo.findLigneReleve(ligneId);
    if (!ligne) throw new NotFoundException('Ligne de relevé introuvable.');
    return this.repo.derapprocherLigne(ligneId);
  }
}
