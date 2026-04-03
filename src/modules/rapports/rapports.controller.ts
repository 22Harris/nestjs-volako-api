import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RapportsService } from './rapports.service';

@Controller('rapports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE, Role.AUDITEUR)
export class RapportsController {
  constructor(private readonly rapportsService: RapportsService) {}

  /** Balance générale des comptes */
  @Get('balance')
  getBalance(@CurrentUser() userId: number) {
    return this.rapportsService.getBalance(userId);
  }

  /** FEC — Fichier des Écritures Comptables (obligation légale France) */
  @Get('fec')
  async getFec(
    @CurrentUser() userId: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Res() res?: Response,
  ) {
    const content = await this.rapportsService.getFec(userId, dateFrom, dateTo);
    const today = new Date().toISOString().split('T')[0].replaceAll('-', '');
    const filename = `FEC_${today}.txt`;
    res!.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res!.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res!.send(content);
  }

  /** Bilan actif/passif à la clôture d'un exercice */
  @Get('bilan')
  getBilan(
    @CurrentUser() userId: number,
    @Query('exercice', ParseIntPipe) exercice: number,
  ) {
    return this.rapportsService.getBilan(userId, exercice);
  }

  /** Compte de résultat (charges/produits) d'un exercice */
  @Get('compte-de-resultat')
  getCompteDeResultat(
    @CurrentUser() userId: number,
    @Query('exercice', ParseIntPipe) exercice: number,
  ) {
    return this.rapportsService.getCompteDeResultat(userId, exercice);
  }

  /** Grand livre par compte */
  @Get('grand-livre/:accountId')
  getGrandLivre(
    @CurrentUser() userId: number,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.rapportsService.getGrandLivre(userId, accountId, dateFrom, dateTo);
  }
}
