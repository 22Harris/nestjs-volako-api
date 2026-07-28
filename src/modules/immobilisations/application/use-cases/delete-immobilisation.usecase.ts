import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IMMOBILISATIONS_REPOSITORY } from '../ports/immobilisations.repository.token';
import type { ImmobilisationsRepository } from '../ports/immobilisations.repository.interface';

@Injectable()
export class DeleteImmobilisationUseCase {
  constructor(
    @Inject(IMMOBILISATIONS_REPOSITORY)
    private readonly repo: ImmobilisationsRepository,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const immo = await this.repo.findById(id, userId);
    if (!immo) throw new NotFoundException('Immobilisation introuvable');

    const hasComptabilisedLines = immo.lignes.some(l => l.comptabilisee);
    if (hasComptabilisedLines) {
      throw new BadRequestException('Impossible de supprimer une immobilisation avec des dotations comptabilisées');
    }

    return this.repo.delete(id, userId);
  }
}
