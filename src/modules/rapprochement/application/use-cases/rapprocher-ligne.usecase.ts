import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { RAPPROCHEMENT_REPOSITORY } from '../ports/rapprochement.repository.token';
import type { RapprochementRepository } from '../ports/rapprochement.repository.interface';

@Injectable()
export class RapprocherLigneUseCase {
  constructor(
    @Inject(RAPPROCHEMENT_REPOSITORY)
    private readonly repo: RapprochementRepository,
  ) {}

  async execute(ligneId: number, journalLineId: number) {
    const ligne = await this.repo.findLigneReleve(ligneId);
    if (!ligne) throw new NotFoundException('Ligne de relevé introuvable.');
    if (ligne.rapprochee) throw new BadRequestException('Cette ligne est déjà rapprochée.');
    return this.repo.rapprocherLigne(ligneId, journalLineId);
  }
}
