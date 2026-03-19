import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import { JournalEntry } from '../../domain/entities/journal-entries.entity';
import { CreateJournalEntryDto } from '../../interface/dtos/create-journal-entry.dto';
import { PERIODE_LOCKS } from '../../../periode-locks/application/ports/periode-locks.token';
import type { PeriodeLocksRepository } from '../../../periode-locks/application/ports/periode-locks.repository.interface';

@Injectable()
export class CreateJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly journalEntryRepository: JournalEntryRepository,
    @Inject(PERIODE_LOCKS)
    private readonly periodeLocksRepository: PeriodeLocksRepository,
  ) {}

  async execute(createJournal: CreateJournalEntryDto, operationId: number | undefined, userId: number): Promise<JournalEntry> {
    const date = new Date(createJournal.date);
    const annee = date.getFullYear();
    const mois = date.getMonth() + 1;
    const locked = await this.periodeLocksRepository.isLocked(annee, mois, userId);
    if (locked) {
      throw new ForbiddenException(`La période ${mois}/${annee} est verrouillée`);
    }

    const journal = new JournalEntry(date, createJournal.label, createJournal.lines);
    return this.journalEntryRepository.createJournalEntry(
      journal,
      operationId ?? createJournal.operationId,
      userId,
      createJournal.journalId,
    );
  }
}
