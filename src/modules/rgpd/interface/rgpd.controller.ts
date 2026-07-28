import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe,
  Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ExporterDonneesPersonnellesUseCase } from '../application/use-cases/exporter-donnees.usecase';
import { AnonymiserUtilisateurUseCase } from '../application/use-cases/anonymiser-utilisateur.usecase';
import { CreerDemandeRgpdUseCase } from '../application/use-cases/creer-demande-rgpd.usecase';
import { ListDemandesRgpdUseCase } from '../application/use-cases/list-demandes-rgpd.usecase';
import { TraiterDemandeRgpdUseCase } from '../application/use-cases/traiter-demande-rgpd.usecase';
import { PurgerAuditLogsUseCase } from '../application/use-cases/purger-audit-logs.usecase';
import { CreerDemandeDto, PurgeAuditDto, TraiterDemandeDto } from './dtos/rgpd.dto';

@ApiTags('rgpd')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
@Controller('rgpd')
export class RgpdController {
  constructor(
    private readonly exporter: ExporterDonneesPersonnellesUseCase,
    private readonly anonymiser: AnonymiserUtilisateurUseCase,
    private readonly creerDemande: CreerDemandeRgpdUseCase,
    private readonly listDemandes: ListDemandesRgpdUseCase,
    private readonly traiterDemande: TraiterDemandeRgpdUseCase,
    private readonly purgeAudit: PurgerAuditLogsUseCase,
  ) {}

  // ── Droit d'accès / portabilité ────────────────────────────────────────────
  @Get('export')
  @ApiOperation({ summary: 'Exporter toutes mes données personnelles (DSAR)' })
  exportAction(@CurrentUser() user: any) {
    return this.exporter.execute(user.userId);
  }

  // ── Anonymisation (ADMIN) ──────────────────────────────────────────────────
  @Post('anonymiser/:userId')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "[ADMIN] Anonymiser un compte utilisateur (droit a l'oubli)" })
  @ApiResponse({ status: 403, description: 'Auto-anonymisation interdite' })
  anonymiserAction(@Param('userId', ParseIntPipe) userId: number, @CurrentUser() user: any) {
    return this.anonymiser.execute(userId, user.userId);
  }

  // ── Demandes RGPD ─────────────────────────────────────────────────────────
  @Post('demandes')
  @HttpCode(201)
  @ApiOperation({ summary: 'Soumettre une demande RGPD (accès, effacement, portabilité, rectification)' })
  creerDemandeAction(@Body() dto: CreerDemandeDto, @CurrentUser() user: any) {
    return this.creerDemande.execute(user.userId, dto.type, dto.note);
  }

  @Get('demandes')
  @ApiOperation({ summary: 'Mes demandes RGPD (ADMIN : toutes les demandes)' })
  listDemandesAction(@CurrentUser() user: any) {
    const isAdmin = user.role === Role.ADMIN;
    return this.listDemandes.execute(isAdmin ? undefined : user.userId);
  }

  @Patch('demandes/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Traiter une demande RGPD (TRAITEE ou REFUSEE)' })
  traiterDemandeAction(@Param('id', ParseIntPipe) id: number, @Body() dto: TraiterDemandeDto) {
    return this.traiterDemande.execute(id, dto.statut, dto.note);
  }

  // ── Purge des logs d'audit (ADMIN) ────────────────────────────────────────
  @Delete('audit-logs/purge')
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "[ADMIN] Purger les logs d'audit anterieurs a N jours (min 90)" })
  purgeAuditAction(@Body() dto: PurgeAuditDto) {
    return this.purgeAudit.execute(dto.olderThanDays);
  }
}
