import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RECURRENTES } from '../ports/recurrentes.token';
import type { RecurrentesRepository } from '../ports/recurrentes.repository.interface';

@Injectable()
export class SupprimerRecurrenteUseCase {
  constructor(
    @Inject(RECURRENTES)
    private readonly repo: RecurrentesRepository,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundException(`Écriture récurrente #${id} introuvable.`);
    await this.repo.delete(id, userId);
  }
}
