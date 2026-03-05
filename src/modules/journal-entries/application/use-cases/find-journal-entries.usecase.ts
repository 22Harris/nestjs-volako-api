import { Inject, Injectable } from "@nestjs/common";
import { JOURNAL_ENTRIES } from "../ports/journal-entries.token";
import type { JournalEntryRepository } from "../ports/journal-entries.repository.interface";
import { JournalEntry } from "../../domain/entities/journal-entries.entity";

@Injectable()
export class FindJournalEntriesUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly journalEntryRepository: JournalEntryRepository,
  ) {}

  execute(operationId?: number): Promise<JournalEntry[]> {
    return this.journalEntryRepository.findJournalEntries(operationId);
  }
}
