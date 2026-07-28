import {
  BadRequestException, Body, Controller, Get, HttpCode,
  Param, ParseIntPipe, Post, UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { TvaService } from './tva.service';
import { CreerDeclarationTvaUseCase } from './application/use-cases/creer-declaration.usecase';
import { ListDeclarationsTvaUseCase } from './application/use-cases/list-declarations.usecase';
import { GetDeclarationTvaUseCase } from './application/use-cases/get-declaration.usecase';
import { SoumettreDeclarationTvaUseCase } from './application/use-cases/soumettre-declaration.usecase';
import { GenererExportTvaUseCase } from './application/use-cases/generer-export-tva.usecase';
import { CreerDeclarationTvaDto } from './interface/dtos/declaration-tva.dto';

@ApiTags('tva')
@ApiCookieAuth('access_token')
@Controller('tva')
@UseGuards(JwtAuthGuard)
export class TvaController {
  constructor(
    private readonly tvaService: TvaService,
    private readonly creerDeclaration: CreerDeclarationTvaUseCase,
    private readonly listDeclarations: ListDeclarationsTvaUseCase,
    private readonly getDeclaration: GetDeclarationTvaUseCase,
    private readonly soumettre: SoumettreDeclarationTvaUseCase,
    private readonly genererExport: GenererExportTvaUseCase,
  ) {}

  // ── Rapport CA3 (calcul en temps réel, non persisté) ─────────────────────
  @Get('ca3')
  @ApiOperation({ summary: 'Calcul du rapport CA3 (non persisté)' })
  getCa3(
    @CurrentUser() user: any,
    @Param('dateFrom') dateFrom: string,
    @Param('dateTo') dateTo: string,
  ) {
    if (!dateFrom || !dateTo) throw new BadRequestException('dateFrom et dateTo sont requis');
    return this.tvaService.getCa3(user.userId, dateFrom, dateTo);
  }

  // ── Déclarations persistées ───────────────────────────────────────────────
  @Post('declarations')
  @HttpCode(201)
  @ApiOperation({ summary: 'Créer une déclaration TVA (CA3) pour une période' })
  @ApiResponse({ status: 201, description: 'Déclaration créée en statut BROUILLON' })
  creerDeclarationAction(@Body() dto: CreerDeclarationTvaDto, @CurrentUser() user: any) {
    return this.creerDeclaration.execute(user.userId, dto.dateFrom, dto.dateTo, dto.periode);
  }

  @Get('declarations')
  @ApiOperation({ summary: 'Lister les déclarations TVA (sans les données CA3 détaillées)' })
  listDeclarationsAction(@CurrentUser() user: any) {
    return this.listDeclarations.execute(user.userId);
  }

  @Get('declarations/:id')
  @ApiOperation({ summary: 'Consulter une déclaration TVA (avec données CA3)' })
  getDeclarationAction(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.getDeclaration.execute(id, user.userId);
  }

  @Post('declarations/:id/soumettre')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marquer une déclaration BROUILLON comme SOUMISE' })
  @ApiResponse({ status: 400, description: 'Déclaration déjà soumise ou validée' })
  soumettreAction(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.soumettre.execute(id, user.userId);
  }

  @Get('declarations/:id/export')
  @ApiOperation({ summary: 'Télécharger le XML CA3 d\'une déclaration' })
  exportAction(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.genererExport.execute(id, user.userId);
  }
}
