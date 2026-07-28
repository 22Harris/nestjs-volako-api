import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateCentreAnalytiqueUseCase } from '../application/use-cases/create-centre.usecase';
import { ListCentresAnalytiquesUseCase } from '../application/use-cases/list-centres.usecase';
import { UpdateCentreAnalytiqueUseCase } from '../application/use-cases/update-centre.usecase';
import { DeleteCentreAnalytiqueUseCase } from '../application/use-cases/delete-centre.usecase';
import { AffecterLignesAnalytiquesUseCase } from '../application/use-cases/affecter-lignes.usecase';
import { GetBalanceAnalytiqueUseCase } from '../application/use-cases/get-balance-analytique.usecase';
import {
  AffecterLignesDto,
  BalanceQueryDto,
  CreateCentreAnalytiqueDto,
  UpdateCentreAnalytiqueDto,
} from './dtos/create-centre.dto';

@ApiTags('analytique')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('analytique')
export class AnalytiqueController {
  constructor(
    private readonly createCentre: CreateCentreAnalytiqueUseCase,
    private readonly listCentres: ListCentresAnalytiquesUseCase,
    private readonly updateCentre: UpdateCentreAnalytiqueUseCase,
    private readonly deleteCentre: DeleteCentreAnalytiqueUseCase,
    private readonly affecter: AffecterLignesAnalytiquesUseCase,
    private readonly balance: GetBalanceAnalytiqueUseCase,
  ) {}

  @Post('centres')
  @HttpCode(201)
  @ApiOperation({ summary: 'Créer un centre analytique' })
  createCentreAction(@Body() dto: CreateCentreAnalytiqueDto, @CurrentUser() user: any) {
    return this.createCentre.execute(dto.code, dto.libelle, user.userId);
  }

  @Get('centres')
  @ApiOperation({ summary: 'Lister les centres analytiques' })
  listCentresAction(@CurrentUser() user: any) {
    return this.listCentres.execute(user.userId);
  }

  @Patch('centres/:id')
  @ApiOperation({ summary: 'Modifier un centre analytique' })
  updateCentreAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCentreAnalytiqueDto,
    @CurrentUser() user: any,
  ) {
    return this.updateCentre.execute(id, dto.code, dto.libelle, user.userId);
  }

  @Delete('centres/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Supprimer un centre analytique (sans mouvements)' })
  deleteCentreAction(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.deleteCentre.execute(id, user.userId);
  }

  @Post('affectations')
  @HttpCode(200)
  @ApiOperation({ summary: 'Affecter une ligne de journal aux centres analytiques (somme = 100 %)' })
  affecterAction(@Body() dto: AffecterLignesDto, @CurrentUser() user: any) {
    return this.affecter.execute(dto.journalLineId, dto.affectations, user.userId);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Balance analytique par centre (écritures validées)' })
  balanceAction(@Query() q: BalanceQueryDto, @CurrentUser() user: any) {
    return this.balance.execute(
      user.userId,
      q.dateFrom ? new Date(q.dateFrom) : undefined,
      q.dateTo ? new Date(q.dateTo) : undefined,
    );
  }
}
