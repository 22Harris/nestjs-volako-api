import { CreateJournalEntryUseCase } from './../application/use-cases/create-journal-entry.usecase';
import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { CreateJournalEntryDto } from './dtos/create-journal-entry.dto';
import { JournalEntry } from '../domain/entities/journal-entries.entity';
import { FindJournalEntriesUseCase } from '../application/use-cases/find-journal-entries.usecase';
import { GetJournalEntryByIdUseCase } from '../application/use-cases/get-journal-entry-by-id.usecase';

@Controller('journal-entry')
export class JournalEntryController{

    constructor(
        private readonly createJournalEntryUseCase: CreateJournalEntryUseCase,
        private readonly findJournalEntriesUseCase: FindJournalEntriesUseCase,
        private readonly getJournalEntryByIdUseCase: GetJournalEntryByIdUseCase,
    ){}

    @Post()
    createJournalEntry(@Body() createJournalEntryDto: CreateJournalEntryDto):Promise<JournalEntry>{
        return this.createJournalEntryUseCase.execute(createJournalEntryDto)
    }

    @Get()
    findJournalEntries():Promise<JournalEntry[]>{
        return this.findJournalEntriesUseCase.execute()
    }

    @Get(':id')
    getJournalEntryById(@Param('id', ParseIntPipe) id: number):Promise<JournalEntry | null>{
        return this.getJournalEntryByIdUseCase.execute(id);
    }
}