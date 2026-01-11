import { Inject, Injectable } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';
import { JournalEntry } from '../../domain/entities/journal-entries.entity';
import { CreateJournalEntryDto } from '../../interface/dtos/create-journal-entry.dto';

@Injectable()
export class CreateJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly journalEntryRepository: JournalEntryRepository,
  ) {}

  execute(
    createJournal: CreateJournalEntryDto,
    operationId?: number,
  ): Promise<JournalEntry> {
    const journal = new JournalEntry(
      new Date(createJournal.date),
      createJournal.label,
      createJournal.lines,
    );

    return this.journalEntryRepository.createJournalEntry(journal, operationId);
  }
}
