import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import { JournalEntry } from '../../domain/entities/journal-entries.entity';
import { PERIODE_LOCKS } from '../../../periode-locks/application/ports/periode-locks.token';
import type { PeriodeLocksRepository } from '../../../periode-locks/application/ports/periode-locks.repository.interface';

@Injectable()
export class UpdateLabelOfJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly journalEntryRepository: JournalEntryRepository,
    @Inject(PERIODE_LOCKS)
    private readonly periodeLocksRepository: PeriodeLocksRepository,
  ) {}

  async execute(journalId: number, label: string, userId: number): Promise<JournalEntry> {
    const entry = await this.journalEntryRepository.getJournalById(journalId, userId);
    if (!entry) throw new NotFoundException(`Écriture ${journalId} introuvable`);

    const annee = entry.date.getFullYear();
    const mois = entry.date.getMonth() + 1;
    const locked = await this.periodeLocksRepository.isLocked(annee, mois, userId);
    if (locked) {
      throw new ForbiddenException(`La période ${mois}/${annee} est verrouillée`);
    }

    return this.journalEntryRepository.updateLabelOfJournalEntry(journalId, label, userId);
  }
}
