import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RAPPROCHEMENT_REPOSITORY } from '../ports/rapprochement.repository.token';
import type { RapprochementRepository } from '../ports/rapprochement.repository.interface';

@Injectable()
export class GetReleveUseCase {
  constructor(
    @Inject(RAPPROCHEMENT_REPOSITORY)
    private readonly repo: RapprochementRepository,
  ) {}

  async execute(id: number, userId: number) {
    const releve = await this.repo.findReleve(id, userId);
    if (!releve) throw new NotFoundException('Relevé introuvable.');
    return releve;
  }
}
