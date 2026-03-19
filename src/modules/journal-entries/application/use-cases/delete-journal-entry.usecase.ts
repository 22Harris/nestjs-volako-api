import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import { PERIODE_LOCKS } from '../../../periode-locks/application/ports/periode-locks.token';
import type { PeriodeLocksRepository } from '../../../periode-locks/application/ports/periode-locks.repository.interface';

@Injectable()
export class DeleteJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly repo: JournalEntryRepository,
    @Inject(PERIODE_LOCKS)
    private readonly periodeLocksRepository: PeriodeLocksRepository,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const entry = await this.repo.getJournalById(id, userId);
    if (!entry) throw new NotFoundException(`Écriture ${id} introuvable`);

    const annee = entry.date.getFullYear();
    const mois = entry.date.getMonth() + 1;
    const locked = await this.periodeLocksRepository.isLocked(annee, mois, userId);
    if (locked) {
      throw new ForbiddenException(`La période ${mois}/${annee} est verrouillée`);
    }

    return this.repo.deleteJournalEntry(id, userId);
  }
}
