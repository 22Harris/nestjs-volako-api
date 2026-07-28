import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ANALYTIQUE_REPOSITORY } from '../ports/analytique.repository.token';
import type { AnalytiqueRepository } from '../ports/analytique.repository.interface';

@Injectable()
export class DeleteCentreAnalytiqueUseCase {
  constructor(@Inject(ANALYTIQUE_REPOSITORY) private readonly repo: AnalytiqueRepository) {}

  async execute(id: number, userId: number): Promise<void> {
    const centre = await this.repo.findCentreById(id, userId);
    if (!centre) throw new NotFoundException(`Centre analytique #${id} introuvable`);

    // Vérifie qu'aucune ligne analytique n'est attachée au centre
    const balance = await this.repo.getBalance(userId);
    const hasMouvements = balance.some(b => b.centre.id === id && (b.debit > 0 || b.credit > 0));
    if (hasMouvements) {
      throw new BadRequestException(
        `Impossible de supprimer : le centre #${id} comporte des mouvements comptables`,
      );
    }
    await this.repo.deleteCentre(id, userId);
  }
}
