import { CreateJournalEntryUseCase } from './../application/use-cases/create-journal-entry.usecase';
import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateJournalEntryDto } from './dtos/create-journal-entry.dto';
import { JournalEntry } from '../domain/entities/journal-entries.entity';
import { FindJournalEntriesUseCase } from '../application/use-cases/find-journal-entries.usecase';

@Controller('journal-entry')
export class JournalEntryController{

    constructor(
        private readonly createJournalEntryUseCase: CreateJournalEntryUseCase,
        private readonly findJournalEntriesUseCase: FindJournalEntriesUseCase,
    ){}

    @Post()
    createJournalEntry(@Body() createJournalEntryDto: CreateJournalEntryDto):Promise<JournalEntry>{
        return this.createJournalEntryUseCase.execute(createJournalEntryDto)
    }

    @Get()
    findJournalEntries():Promise<JournalEntry[]>{
        return this.findJournalEntriesUseCase.execute()
    }
}