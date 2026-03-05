import { Inject, Injectable } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';

@Injectable()
export class DeleteJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly repo: JournalEntryRepository,
  ) {}

  execute(id: number): Promise<void> {
    return this.repo.deleteJournalEntry(id);
  }
}
