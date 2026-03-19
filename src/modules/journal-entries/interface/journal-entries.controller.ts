import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateJournalEntryDto } from './dtos/create-journal-entry.dto';
import { JournalEntry } from '../domain/entities/journal-entries.entity';
import { CreateJournalEntryUseCase } from '../application/use-cases/create-journal-entry.usecase';
import { FindJournalEntriesUseCase } from '../application/use-cases/find-journal-entries.usecase';
import { GetJournalEntryByIdUseCase } from '../application/use-cases/get-journal-entry-by-id.usecase';
import { UpdateLabelOfJournalEntryUseCase } from '../application/use-cases/update-label-of-journal-entry.usecase';
import { DeleteJournalEntryUseCase } from '../application/use-cases/delete-journal-entry.usecase';
import { LettrerLignesUseCase } from '../application/use-cases/lettrer-lignes.usecase';
import { DelettrerLignesUseCase } from '../application/use-cases/delettrer-lignes.usecase';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('journal-entry')
export class JournalEntryController {
  constructor(
    private readonly createJournalEntryUseCase: CreateJournalEntryUseCase,
    private readonly findJournalEntriesUseCase: FindJournalEntriesUseCase,
    private readonly getJournalEntryByIdUseCase: GetJournalEntryByIdUseCase,
    private readonly updateLabelOfJournalEntryUseCase: UpdateLabelOfJournalEntryUseCase,
    private readonly deleteJournalEntryUseCase: DeleteJournalEntryUseCase,
    private readonly lettrerLignesUseCase: LettrerLignesUseCase,
    private readonly delettrerLignesUseCase: DelettrerLignesUseCase,
  ) {}

  @Post()
  createJournalEntry(@Body() dto: CreateJournalEntryDto, @CurrentUser() userId: number): Promise<JournalEntry> {
    return this.createJournalEntryUseCase.execute(dto, undefined, userId);
  }

  @Get()
  findJournalEntries(
    @CurrentUser() userId: number,
    @Query('operationId') operationId?: string,
    @Query('journalId') journalId?: string,
  ): Promise<JournalEntry[]> {
    return this.findJournalEntriesUseCase.execute(
      userId,
      operationId === undefined ? undefined : Number(operationId),
      journalId === undefined ? undefined : Number(journalId),
    );
  }

  @Get(':id')
  getJournalEntryById(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<JournalEntry | null> {
    return this.getJournalEntryByIdUseCase.execute(id, userId);
  }

  @Patch(':id')
  updateJournalEntryLabel(
    @Param('id', ParseIntPipe) id: number,
    @Body('label') label: string,
    @CurrentUser() userId: number,
  ): Promise<JournalEntry> {
    return this.updateLabelOfJournalEntryUseCase.execute(id, label, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteJournalEntry(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<void> {
    return this.deleteJournalEntryUseCase.execute(id, userId);
  }

  /** Lettrage : assigne la même lettre à un ensemble de lignes équilibrées sur un compte */
  @Post('lettrage')
  lettrerLignes(
    @Body('lineIds') lineIds: number[],
    @CurrentUser() userId: number,
  ): Promise<{ lettre: string }> {
    return this.lettrerLignesUseCase.execute(lineIds, userId);
  }

  /** Délettrage : retire la lettre des lignes spécifiées */
  @Delete('lettrage')
  @HttpCode(204)
  delettrerLignes(
    @Body('lineIds') lineIds: number[],
    @CurrentUser() userId: number,
  ): Promise<void> {
    return this.delettrerLignesUseCase.execute(lineIds, userId);
  }
}
