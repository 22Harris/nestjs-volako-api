import { Inject, Injectable } from "@nestjs/common";
import { JOURNAL_ENTRIES } from "../ports/journal-entries.token";
import type { JournalEntryRepository } from "../ports/journal-entries.repository.interface";
import { CreateJournalEntryDto } from "../../interface/dtos/create-journal-entry.dto";
import { JournalEntry } from "../../domain/entities/journal-entries.entity";

@Injectable()
export class UpdateLabelOfJournalEntryUseCase{

    constructor(
        @Inject(JOURNAL_ENTRIES)
        private readonly journalEntryRepository: JournalEntryRepository
    ){}

    execute(journalId: number, label: string): Promise<JournalEntry>{
        return this.journalEntryRepository.updateLabelOfJournalEntry(journalId, label);
    }
}