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
import { ValiderJournalEntryUseCase } from '../application/use-cases/valider-journal-entry.usecase';
import { RejeterJournalEntryUseCase } from '../application/use-cases/rejeter-journal-entry.usecase';
import { VerrouillerJournalEntryUseCase } from '../application/use-cases/verrouiller-journal-entry.usecase';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CurrentRole } from 'src/common/decorators/current-role.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
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
    private readonly validerJournalEntryUseCase: ValiderJournalEntryUseCase,
    private readonly rejeterJournalEntryUseCase: RejeterJournalEntryUseCase,
    private readonly verrouillerJournalEntryUseCase: VerrouillerJournalEntryUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE, Role.ASSISTANT)
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
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE, Role.ASSISTANT)
  updateJournalEntryLabel(
    @Param('id', ParseIntPipe) id: number,
    @Body('label') label: string,
    @CurrentUser() userId: number,
    @CurrentRole() role: Role,
  ): Promise<JournalEntry> {
    return this.updateLabelOfJournalEntryUseCase.execute(id, label, userId, role);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE, Role.ASSISTANT)
  deleteJournalEntry(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() userId: number,
    @CurrentRole() role: Role,
  ): Promise<void> {
    return this.deleteJournalEntryUseCase.execute(id, userId, role);
  }

  @Patch(':id/valider')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  valider(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<void> {
    return this.validerJournalEntryUseCase.execute(id, userId);
  }

  @Patch(':id/rejeter')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  rejeter(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<void> {
    return this.rejeterJournalEntryUseCase.execute(id, userId);
  }

  @Patch(':id/verrouiller')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE)
  verrouiller(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number): Promise<void> {
    return this.verrouillerJournalEntryUseCase.execute(id, userId);
  }

  @Post('lettrage')
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  lettrerLignes(
    @Body('lineIds') lineIds: number[],
    @CurrentUser() userId: number,
  ): Promise<{ lettre: string }> {
    return this.lettrerLignesUseCase.execute(lineIds, userId);
  }

  @Delete('lettrage')
  @HttpCode(204)
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  delettrerLignes(
    @Body('lineIds') lineIds: number[],
    @CurrentUser() userId: number,
  ): Promise<void> {
    return this.delettrerLignesUseCase.execute(lineIds, userId);
  }
}
