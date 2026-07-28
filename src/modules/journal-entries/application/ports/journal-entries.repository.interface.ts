import { JournalEntry, EntryStatus } from '../../domain/entities/journal-entries.entity';
import { PaginatedResult } from '../../../../common/dto/paginated.js';

export interface EntryMeta {
  id: number;
  statut: EntryStatus;
  userId: number;
  date: Date;
}

export interface AccountBalance {
  accountId: number;
  accountCode: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
}

export interface LineForLettrage {
  id: number;
  debit: number;
  credit: number;
  lettre: string | null;
  date: Date;
  entryLabel: string;
  pieceNumber: string | null;
}

export interface JournalEntryRepository {
  createJournalEntry(journal: JournalEntry, operationId: number | undefined, userId: number, journalId?: number): Promise<JournalEntry>;
  findJournalEntries(userId: number, operationId?: number, journalId?: number, page?: number, pageSize?: number): Promise<PaginatedResult<JournalEntry>>;
  getJournalById(journalId: number, userId: number): Promise<JournalEntry | null>;
  updateLabelOfJournalEntry(journalId: number, label: string, userId: number): Promise<JournalEntry>;
  deleteJournalEntry(journalId: number, userId: number): Promise<void>;
  nextPieceNumber(journalDbId: number, year: number, prefix: string): Promise<string>;
  getAccountBalances(userId: number, dateFrom?: Date, dateTo?: Date): Promise<AccountBalance[]>;
  lettrerLignes(lineIds: number[], userId: number): Promise<string>;
  deletterLignes(lineIds: number[], userId: number): Promise<void>;
  getEntryMeta(id: number): Promise<EntryMeta | null>;
  updateStatut(id: number, statut: EntryStatus): Promise<void>;
  getUnletteredLines(accountId: number, userId: number): Promise<LineForLettrage[]>;
  getLinesForAccount(accountId: number, userId: number): Promise<LineForLettrage[]>;
}
