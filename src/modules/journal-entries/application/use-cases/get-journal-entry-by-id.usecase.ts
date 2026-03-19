import type { JournalEntryRepository } from './../ports/journal-entries.repository.interface';
import { Inject, Injectable } from "@nestjs/common";
import { JOURNAL_ENTRIES } from "../ports/journal-entries.token";
import { JournalEntry } from '../../domain/entities/journal-entries.entity';

@Injectable()
export class GetJournalEntryByIdUseCase{

    constructor(
        @Inject(JOURNAL_ENTRIES)
        private readonly journalEntryRepository: JournalEntryRepository
    ){}

    execute(journalId: number, userId: number):Promise<JournalEntry | null>{
        return this.journalEntryRepository.getJournalById(journalId, userId);
    }
}
