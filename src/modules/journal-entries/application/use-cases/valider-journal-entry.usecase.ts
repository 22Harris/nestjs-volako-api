import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';

@Injectable()
export class ValiderJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly repo: JournalEntryRepository,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const meta = await this.repo.getEntryMeta(id);
    if (!meta) throw new NotFoundException(`Écriture ${id} introuvable`);
    if (meta.statut !== 'BROUILLON') {
      throw new BadRequestException(`Seule une écriture en BROUILLON peut être validée (statut actuel : ${meta.statut})`);
    }
    await this.repo.updateStatut(id, 'VALIDE');
  }
}
