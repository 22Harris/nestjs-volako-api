import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RelanceRepository } from '../ports/relance.repository.interface';
import { RELANCE_REPOSITORY } from '../ports/relance.repository.token';
import type { Relance } from '../../domain/entities/relance.entity';

const NIVEAU_MAX = 3;

@Injectable()
export class CreateRelanceUseCase {
  constructor(@Inject(RELANCE_REPOSITORY) private readonly repo: RelanceRepository) {}

  async execute(factureId: number, note: string | undefined, userId: number): Promise<Relance> {
    const enRetard = await this.repo.getFacturesEnRetard(userId);
    const facture = enRetard.find(f => f.id === factureId);

    if (!facture) {
      throw new NotFoundException(
        `Facture #${factureId} introuvable ou non en retard de paiement`,
      );
    }

    if (facture.niveauRelanceSuivant > NIVEAU_MAX) {
      throw new BadRequestException(
        `Niveau maximum de relance (${NIVEAU_MAX}) déjà atteint pour la facture #${factureId}`,
      );
    }

    return this.repo.create(factureId, facture.niveauRelanceSuivant, note, userId);
  }
}
