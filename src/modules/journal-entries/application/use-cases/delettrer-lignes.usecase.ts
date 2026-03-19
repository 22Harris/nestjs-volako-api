import { Inject, Injectable } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository } from '../ports/journal-entries.repository.interface';

@Injectable()
export class DelettrerLignesUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly journalEntryRepository: JournalEntryRepository,
  ) {}

  async execute(lineIds: number[], userId: number): Promise<void> {
    return this.journalEntryRepository.deletterLignes(lineIds, userId);
  }
}
