import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { GetFacturesEnRetardUseCase } from '../application/use-cases/get-factures-en-retard.usecase';
import { CreateRelanceUseCase } from '../application/use-cases/create-relance.usecase';
import { GetRelancesUseCase } from '../application/use-cases/get-relances.usecase';
import { GenerateLettreRelanceUseCase } from '../application/use-cases/generate-lettre-relance.usecase';
import { CreateRelanceDto } from './dtos/create-relance.dto';

@ApiTags('relances')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('relances')
export class RelancesController {
  constructor(
    private readonly getEnRetard: GetFacturesEnRetardUseCase,
    private readonly create: CreateRelanceUseCase,
    private readonly getAll: GetRelancesUseCase,
    private readonly lettre: GenerateLettreRelanceUseCase,
  ) {}

  @Get('en-retard')
  @ApiOperation({ summary: 'Factures en retard de paiement avec niveau de relance suivant' })
  listEnRetard(@CurrentUser() user: any) {
    return this.getEnRetard.execute(user.userId);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Créer une relance pour une facture en retard' })
  @ApiResponse({ status: 201, description: 'Relance créée' })
  @ApiResponse({ status: 404, description: 'Facture introuvable ou non en retard' })
  @ApiResponse({ status: 400, description: 'Niveau maximum atteint' })
  createRelance(@Body() dto: CreateRelanceDto, @CurrentUser() user: any) {
    return this.create.execute(dto.factureId, dto.note, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les relances (toutes ou par facture)' })
  @ApiQuery({ name: 'factureId', required: false, type: Number })
  listRelances(@CurrentUser() user: any, @Query('factureId', new ParseIntPipe({ optional: true })) factureId?: number) {
    return this.getAll.execute(user.userId, factureId);
  }

  @Get(':factureId/lettre')
  @ApiOperation({ summary: 'Générer la lettre de relance HTML pour une facture' })
  getLettreRelance(@Param('factureId', ParseIntPipe) factureId: number, @CurrentUser() user: any) {
    return this.lettre.execute(factureId, user.userId);
  }
}
