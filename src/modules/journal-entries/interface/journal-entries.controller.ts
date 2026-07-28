import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportCsvEcrituresUseCase, type CsvImportResult } from '../application/use-cases/import-csv-ecritures.usecase';
import { CreateJournalEntryDto } from './dtos/create-journal-entry.dto';
import { JournalEntry } from '../domain/entities/journal-entries.entity';
import { CreateJournalEntryUseCase } from '../application/use-cases/create-journal-entry.usecase';
import { FindJournalEntriesUseCase } from '../application/use-cases/find-journal-entries.usecase';
import { GetJournalEntryByIdUseCase } from '../application/use-cases/get-journal-entry-by-id.usecase';
import { UpdateLabelOfJournalEntryUseCase } from '../application/use-cases/update-label-of-journal-entry.usecase';
import { DeleteJournalEntryUseCase } from '../application/use-cases/delete-journal-entry.usecase';
import { LettrerLignesUseCase } from '../application/use-cases/lettrer-lignes.usecase';
import { DelettrerLignesUseCase } from '../application/use-cases/delettrer-lignes.usecase';
import { AutoLettrerLignesUseCase } from '../application/use-cases/auto-lettrer-lignes.usecase';
import { GetLignesCompteUseCase } from '../application/use-cases/get-lignes-compte.usecase';
import { ValiderJournalEntryUseCase } from '../application/use-cases/valider-journal-entry.usecase';
import { RejeterJournalEntryUseCase } from '../application/use-cases/rejeter-journal-entry.usecase';
import { VerrouillerJournalEntryUseCase } from '../application/use-cases/verrouiller-journal-entry.usecase';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CurrentRole } from 'src/common/decorators/current-role.decorator';

@ApiTags('journal-entries')
@ApiCookieAuth('access_token')
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
    private readonly autoLettrerLignesUseCase: AutoLettrerLignesUseCase,
    private readonly getLignesCompteUseCase: GetLignesCompteUseCase,
    private readonly importCsvUseCase: ImportCsvEcrituresUseCase,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE, Role.ASSISTANT)
  @ApiOperation({ summary: 'Créer une écriture comptable en partie double' })
  @ApiResponse({ status: 201, description: 'Écriture créée' })
  @ApiResponse({ status: 403, description: 'Période verrouillée' })
  createJournalEntry(@Body() dto: CreateJournalEntryDto, @CurrentUser() userId: number): Promise<JournalEntry> {
    return this.createJournalEntryUseCase.execute(dto, undefined, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les écritures comptables' })
  findJournalEntries(
    @CurrentUser() userId: number,
    @Query('operationId') operationId?: string,
    @Query('journalId') journalId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.findJournalEntriesUseCase.execute(
      userId,
      operationId === undefined ? undefined : Number(operationId),
      journalId === undefined ? undefined : Number(journalId),
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined,
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
  @ApiOperation({ summary: 'Valider une écriture (statut BROUILLON → VALIDEE)' })
  @ApiResponse({ status: 200, description: 'Écriture validée' })
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

  @Get('lettrage/account/:accountId')
  @ApiOperation({ summary: 'Lister les lignes d\'un compte groupées par lettre de lettrage' })
  getLignesCompte(
    @Param('accountId', ParseIntPipe) accountId: number,
    @CurrentUser() userId: number,
  ) {
    return this.getLignesCompteUseCase.execute(accountId, userId);
  }

  @Post('lettrage/auto')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @ApiOperation({ summary: 'Lettrage automatique : apparie les lignes équilibrées d\'un compte' })
  @ApiResponse({ status: 200, description: 'Groupes lettrés automatiquement' })
  autoLettrerLignes(
    @Body('accountId') accountId: number,
    @CurrentUser() userId: number,
  ): Promise<{ groupes: number; lignes: number }> {
    return this.autoLettrerLignesUseCase.execute(accountId, userId);
  }

  // ── Import CSV ────────────────────────────────────────────────────────────

  @Post('import-csv')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Importer des écritures comptables depuis un fichier CSV' })
  @ApiResponse({ status: 200, description: 'Résultat du traitement : imported, skipped, errors' })
  importCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userId: number,
  ): Promise<CsvImportResult> {
    return this.importCsvUseCase.execute(file.buffer, userId);
  }
}
