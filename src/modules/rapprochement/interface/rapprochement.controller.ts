import {
  Controller, Get, Post, Delete, Patch, Param, Body,
  ParseIntPipe, HttpCode, UseGuards, UseInterceptors, UploadedFile, Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

interface UploadedFileType {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ImportReleveUseCase }         from '../application/use-cases/import-releve.usecase';
import { GetRelevesUseCase }           from '../application/use-cases/get-releves.usecase';
import { GetReleveUseCase }            from '../application/use-cases/get-releve.usecase';
import { DeleteReleveUseCase }         from '../application/use-cases/delete-releve.usecase';
import { RapprocherLigneUseCase }      from '../application/use-cases/rapprocher-ligne.usecase';
import { DerapprocherLigneUseCase }    from '../application/use-cases/derapprocher-ligne.usecase';
import { FindMatchCandidatesUseCase }  from '../application/use-cases/find-match-candidates.usecase';
import { AutoMatchReleveUseCase }      from '../application/use-cases/auto-match-releve.usecase';
import { RapprocherLigneDto }          from './dtos/rapprocher-ligne.dto';

@UseGuards(JwtAuthGuard)
@Controller('rapprochement')
export class RapprochementController {
  constructor(
    private readonly importReleve:       ImportReleveUseCase,
    private readonly getReleves:         GetRelevesUseCase,
    private readonly getReleve:          GetReleveUseCase,
    private readonly deleteReleve:       DeleteReleveUseCase,
    private readonly rapprocherLigne:    RapprocherLigneUseCase,
    private readonly derapprocherLigne:  DerapprocherLigneUseCase,
    private readonly findCandidates:     FindMatchCandidatesUseCase,
    private readonly autoMatchReleve:    AutoMatchReleveUseCase,
  ) {}

  /** POST /rapprochement/import — importer un relevé CSV ou OFX */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importFile(
    @UploadedFile() file: UploadedFileType,
    @CurrentUser() userId: number,
  ) {
    return this.importReleve.execute(file.originalname, file.buffer, userId);
  }

  /** GET /rapprochement/releves */
  @Get('releves')
  findAll(@CurrentUser() userId: number) {
    return this.getReleves.execute(userId);
  }

  /** GET /rapprochement/releves/:id */
  @Get('releves/:id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() userId: number,
  ) {
    return this.getReleve.execute(id, userId);
  }

  /** DELETE /rapprochement/releves/:id */
  @Delete('releves/:id')
  @HttpCode(204)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() userId: number,
  ) {
    return this.deleteReleve.execute(id, userId);
  }

  /** PATCH /rapprochement/lignes/:id/rapprocher */
  @Patch('lignes/:id/rapprocher')
  rapprocher(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RapprocherLigneDto,
  ) {
    return this.rapprocherLigne.execute(id, dto.journalLineId);
  }

  /** PATCH /rapprochement/lignes/:id/derapprocher */
  @Patch('lignes/:id/derapprocher')
  derapprocher(@Param('id', ParseIntPipe) id: number) {
    return this.derapprocherLigne.execute(id);
  }

  /** GET /rapprochement/lignes/:id/candidates — suggestions de rapprochement automatique */
  @Get('lignes/:id/candidates')
  getCandidates(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() userId: number,
  ) {
    return this.findCandidates.execute(id, userId);
  }

  /** POST /rapprochement/releves/:id/auto-match — applique les matches haute-confiance */
  @Post('releves/:id/auto-match')
  autoMatch(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() userId: number,
    @Query('threshold') threshold?: string,
  ) {
    return this.autoMatchReleve.execute(id, userId, threshold ? +threshold : undefined);
  }
}
