import { CreateJournalEntryUseCase } from './../application/use-cases/create-journal-entry.usecase';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { CreateJournalEntryDto } from './dtos/create-journal-entry.dto';
import { JournalEntry } from '../domain/entities/journal-entries.entity';
import { FindJournalEntriesUseCase } from '../application/use-cases/find-journal-entries.usecase';
import { GetJournalEntryByIdUseCase } from '../application/use-cases/get-journal-entry-by-id.usecase';
import { UpdateLabelOfJournalEntryUseCase } from '../application/use-cases/update-label-of-journal-entry.usecase';

@Controller('journal-entry')
export class JournalEntryController{

    constructor(
        private readonly createJournalEntryUseCase: CreateJournalEntryUseCase,
        private readonly findJournalEntriesUseCase: FindJournalEntriesUseCase,
        private readonly getJournalEntryByIdUseCase: GetJournalEntryByIdUseCase,
        private readonly updateLabelOfJournalEntryUseCase: UpdateLabelOfJournalEntryUseCase
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

    @Patch(':id')
    updateJournalEntryLabel(@Param('id', ParseIntPipe) id: number, @Body('label') label: string):Promise<JournalEntry>{
        return this.updateLabelOfJournalEntryUseCase.execute(id,label)
    }
}