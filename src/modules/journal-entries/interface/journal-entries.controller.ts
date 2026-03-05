import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateJournalEntryDto } from './dtos/create-journal-entry.dto';
import { JournalEntry } from '../domain/entities/journal-entries.entity';
import { CreateJournalEntryUseCase } from '../application/use-cases/create-journal-entry.usecase';
import { FindJournalEntriesUseCase } from '../application/use-cases/find-journal-entries.usecase';
import { GetJournalEntryByIdUseCase } from '../application/use-cases/get-journal-entry-by-id.usecase';
import { UpdateLabelOfJournalEntryUseCase } from '../application/use-cases/update-label-of-journal-entry.usecase';
import { DeleteJournalEntryUseCase } from '../application/use-cases/delete-journal-entry.usecase';

@Controller('journal-entry')
export class JournalEntryController {
  constructor(
    private readonly createJournalEntryUseCase: CreateJournalEntryUseCase,
    private readonly findJournalEntriesUseCase: FindJournalEntriesUseCase,
    private readonly getJournalEntryByIdUseCase: GetJournalEntryByIdUseCase,
    private readonly updateLabelOfJournalEntryUseCase: UpdateLabelOfJournalEntryUseCase,
    private readonly deleteJournalEntryUseCase: DeleteJournalEntryUseCase,
  ) {}

  @Post()
  createJournalEntry(@Body() dto: CreateJournalEntryDto): Promise<JournalEntry> {
    return this.createJournalEntryUseCase.execute(dto);
  }

  @Get()
  findJournalEntries(@Query('operationId') operationId?: string): Promise<JournalEntry[]> {
    return this.findJournalEntriesUseCase.execute(
      operationId !== undefined ? Number(operationId) : undefined,
    );
  }

  @Get(':id')
  getJournalEntryById(@Param('id', ParseIntPipe) id: number): Promise<JournalEntry | null> {
    return this.getJournalEntryByIdUseCase.execute(id);
  }

  @Patch(':id')
  updateJournalEntryLabel(
    @Param('id', ParseIntPipe) id: number,
    @Body('label') label: string,
  ): Promise<JournalEntry> {
    return this.updateLabelOfJournalEntryUseCase.execute(id, label);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteJournalEntry(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.deleteJournalEntryUseCase.execute(id);
  }
}
