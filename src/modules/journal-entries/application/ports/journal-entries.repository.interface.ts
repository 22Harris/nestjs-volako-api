import { JournalEntry } from "../../domain/entities/journal-entries.entity";

export interface JournalEntryRepository{
    createJournalEntry(journal: JournalEntry): Promise<JournalEntry>;
    findJournalEntries():Promise<JournalEntry[]>;
    getJournalById(journalId: number):Promise<JournalEntry | null>;
    updateLabelOfJournalEntry(journalId: number, label: string):Promise<JournalEntry>;
}