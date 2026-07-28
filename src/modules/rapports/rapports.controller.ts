import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RapportsService } from './rapports.service';
import { AuditLogService } from 'src/common/audit-log/audit-log.service';

@ApiTags('rapports')
@ApiCookieAuth('access_token')
@Controller('rapports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE, Role.AUDITEUR)
export class RapportsController {
  constructor(
    private readonly rapportsService: RapportsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Balance générale des comptes (paginée, mise en cache 5 min)' })
  @ApiQuery({ name: 'page',     required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getBalance(
    @CurrentUser() userId: number,
    @Query('page')     page?:     string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.rapportsService.getBalance(userId, page ? +page : 1, pageSize ? +pageSize : 50);
  }

  @Get('fec')
  @ApiOperation({ summary: 'FEC TXT — Fichier des Écritures Comptables (obligation légale DGFiP)' })
  @ApiQuery({ name: 'exerciceId', required: false, type: Number, description: 'Filtre par exercice fiscal (prioritaire sur dateFrom/dateTo)' })
  @ApiQuery({ name: 'dateFrom',   required: false })
  @ApiQuery({ name: 'dateTo',     required: false })
  async getFec(
    @CurrentUser() userId: number,
    @Query('exerciceId') exerciceId?: string,
    @Query('dateFrom')   dateFrom?: string,
    @Query('dateTo')     dateTo?: string,
    @Res() res?: Response,
  ) {
    const { content, annee } = await this.rapportsService.getFec(userId, dateFrom, dateTo, exerciceId ? +exerciceId : undefined);
    await this.auditLog.log({ userId, action: 'FEC_EXPORT', details: `format=TXT exerciceId=${exerciceId ?? ''} dateFrom=${dateFrom ?? ''} dateTo=${dateTo ?? ''}` });
    const label = annee ?? new Date().toISOString().split('T')[0].replaceAll('-', '');
    res!.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res!.setHeader('Content-Disposition', `attachment; filename="FEC_${label}.txt"`);
    res!.send(content);
  }

  @Get('fec/excel')
  @ApiOperation({ summary: 'FEC Excel — même données que le TXT, format tableur' })
  @ApiQuery({ name: 'exerciceId', required: false, type: Number, description: 'Filtre par exercice fiscal (prioritaire sur dateFrom/dateTo)' })
  @ApiQuery({ name: 'dateFrom',   required: false })
  @ApiQuery({ name: 'dateTo',     required: false })
  async getFecExcel(
    @CurrentUser() userId: number,
    @Query('exerciceId') exerciceId?: string,
    @Query('dateFrom')   dateFrom?: string,
    @Query('dateTo')     dateTo?: string,
    @Res() res?: Response,
  ) {
    const { buffer, annee } = await this.rapportsService.getFecExcel(userId, dateFrom, dateTo, exerciceId ? +exerciceId : undefined);
    await this.auditLog.log({ userId, action: 'FEC_EXPORT', details: `format=XLSX exerciceId=${exerciceId ?? ''} dateFrom=${dateFrom ?? ''} dateTo=${dateTo ?? ''}` });
    const label = annee ?? new Date().toISOString().split('T')[0].replaceAll('-', '');
    res!.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res!.setHeader('Content-Disposition', `attachment; filename="FEC_${label}.xlsx"`);
    res!.send(buffer);
  }

  @Get('fec/validate')
  @ApiOperation({ summary: 'Validation pré-DGFiP du FEC — vérifie le format sans générer le fichier' })
  @ApiQuery({ name: 'exerciceId', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom',   required: false })
  @ApiQuery({ name: 'dateTo',     required: false })
  validateFec(
    @CurrentUser() userId: number,
    @Query('exerciceId') exerciceId?: string,
    @Query('dateFrom')   dateFrom?: string,
    @Query('dateTo')     dateTo?: string,
  ) {
    return this.rapportsService.validateFec(userId, dateFrom, dateTo, exerciceId ? +exerciceId : undefined);
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

  @Get('grand-livre/:accountId')
  @ApiOperation({ summary: 'Grand livre d\'un compte (paginé, mis en cache 5 min)' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiQuery({ name: 'page',     required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  getGrandLivre(
    @CurrentUser() userId: number,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?: string,
    @Query('page')     page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.rapportsService.getGrandLivre(
      userId, accountId, dateFrom, dateTo,
      page ? +page : 1,
      pageSize ? +pageSize : 50,
    );
  }
}
