import { JournalEntry } from '../../domain/entities/journal-entries.entity';

export interface JournalEntryRepository {
  createJournalEntry(journal: JournalEntry, operationId?: number): Promise<JournalEntry>;
  findJournalEntries(operationId?: number): Promise<JournalEntry[]>;
  getJournalById(journalId: number): Promise<JournalEntry | null>;
  updateLabelOfJournalEntry(journalId: number, label: string): Promise<JournalEntry>;
  deleteJournalEntry(journalId: number): Promise<void>;
}
