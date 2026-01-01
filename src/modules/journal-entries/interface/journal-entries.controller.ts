import { CreateJournalEntryUseCase } from './../application/use-cases/create-journal-entry.usecase';
import { Body, Controller, Post } from "@nestjs/common";
import { CreateJournalEntryDto } from './dtos/create-journal-entry.dto';
import { JournalEntry } from '../domain/entities/journal-entries.entity';

@Controller('journal-entry')
export class JournalEntryController{

    constructor(
        private readonly createJournalEntryUseCase: CreateJournalEntryUseCase
    ){}

    @Post()
    createJournalEntry(@Body() createJournalEntryDto: CreateJournalEntryDto):Promise<JournalEntry>{
        return this.createJournalEntryUseCase.execute(createJournalEntryDto)
    }
}