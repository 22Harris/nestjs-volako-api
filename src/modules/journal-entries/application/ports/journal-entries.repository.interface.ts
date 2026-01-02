import { JournalEntry } from "../../domain/entities/journal-entries.entity";

export interface JournalEntryRepository{
    createJournalEntry(journal: JournalEntry): Promise<JournalEntry>;
    findJournalEntries():Promise<JournalEntry[]>;
}