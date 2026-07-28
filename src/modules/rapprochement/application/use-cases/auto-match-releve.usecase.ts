import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RAPPROCHEMENT_REPOSITORY } from '../ports/rapprochement.repository.token';
import type { RapprochementRepository } from '../ports/rapprochement.repository.interface';
import { FindMatchCandidatesUseCase } from './find-match-candidates.usecase';

const AUTO_MATCH_THRESHOLD = 75; // score minimum pour appliquer automatiquement

export interface AutoMatchResult {
  total:   number;
  matched: number;
  skipped: number;
}

@Injectable()
export class AutoMatchReleveUseCase {
  constructor(
    @Inject(RAPPROCHEMENT_REPOSITORY)
    private readonly repo: RapprochementRepository,
    private readonly findCandidates: FindMatchCandidatesUseCase,
  ) {}

  async execute(releveId: number, userId: number, threshold = AUTO_MATCH_THRESHOLD): Promise<AutoMatchResult> {
    const releve = await this.repo.findReleve(releveId, userId);
    if (!releve) throw new NotFoundException('Relevé introuvable.');

    const pendingLignes = await this.repo.findPendingLignesForReleve(releveId, userId);
    let matched = 0;
    let skipped = 0;

    for (const ligne of pendingLignes) {
      const candidates = await this.findCandidates.execute(ligne.id!, userId);
      const best = candidates[0];

      if (best && best.score >= threshold) {
        await this.repo.rapprocherLigne(ligne.id!, best.journalLineId);
        matched++;
      } else {
        skipped++;
      }
    }

    return { total: pendingLignes.length, matched, skipped };
  }
}
