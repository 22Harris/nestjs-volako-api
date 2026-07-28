import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COMPTE_BANK_REPOSITORY } from '../ports/compte-bank.repository.interface';
import type { CompteBankRepository } from '../ports/compte-bank.repository.interface';

@Injectable()
export class SupprimerCompteBankUseCase {
  constructor(
    @Inject(COMPTE_BANK_REPOSITORY)
    private readonly repo: CompteBankRepository,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundException(`Compte bancaire #${id} introuvable.`);
    await this.repo.delete(id, userId);
  }
}
