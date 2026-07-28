import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { InitierAutorisationUseCase } from '../application/use-cases/initier-autorisation.usecase';
import { EnregistrerCompteBankUseCase } from '../application/use-cases/enregistrer-compte-bank.usecase';
import { ListerComptesBankUseCase } from '../application/use-cases/lister-comptes-bank.usecase';
import { SupprimerCompteBankUseCase } from '../application/use-cases/supprimer-compte-bank.usecase';
import { SynchroniserTransactionsUseCase } from '../application/use-cases/synchroniser-transactions.usecase';
import { EnregistrerCompteBankDto, InitierAutorisationDto, SynchroniserDto } from './dtos/psd2.dto';

@ApiTags('open-banking')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('open-banking')
export class Psd2Controller {
  constructor(
    private readonly initierUC: InitierAutorisationUseCase,
    private readonly enregistrerUC: EnregistrerCompteBankUseCase,
    private readonly listerUC: ListerComptesBankUseCase,
    private readonly supprimerUC: SupprimerCompteBankUseCase,
    private readonly syncUC: SynchroniserTransactionsUseCase,
  ) {}

  @Post('initier')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @ApiOperation({ summary: "Initier le flux OAuth PSD2 — retourne l'URL d'autorisation bancaire" })
  initier(@Body() dto: InitierAutorisationDto) {
    return this.initierUC.execute(dto.redirectUri);
  }

  @Post('comptes')
  @HttpCode(201)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @ApiOperation({ summary: 'Connecter un compte bancaire via le code OAuth PSD2' })
  @ApiResponse({ status: 201, description: 'Compte bancaire connecté' })
  enregistrer(@Body() dto: EnregistrerCompteBankDto, @CurrentUser() userId: number) {
    return this.enregistrerUC.execute(dto, userId);
  }

  @Get('comptes')
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE, Role.AUDITEUR)
  @ApiOperation({ summary: 'Lister les comptes bancaires connectés' })
  lister(@CurrentUser() userId: number) {
    return this.listerUC.execute(userId);
  }

  @Delete('comptes/:id')
  @HttpCode(204)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE)
  @ApiOperation({ summary: 'Déconnecter un compte bancaire' })
  @ApiResponse({ status: 204, description: 'Déconnecté' })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  supprimer(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) {
    return this.supprimerUC.execute(id, userId);
  }

  @Post('comptes/:id/sync')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.DAF, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @ApiOperation({ summary: 'Synchroniser les transactions depuis la banque (crée un relevé de rapprochement)' })
  @ApiResponse({ status: 200, description: 'Résultat : compteBankId, releveId, transactions' })
  @ApiResponse({ status: 404, description: 'Compte introuvable' })
  sync(
    @Param('id', ParseIntPipe) id: number,
    @Query() dto: SynchroniserDto,
    @CurrentUser() userId: number,
  ) {
    return this.syncUC.execute(id, userId, dto.dateTo ? new Date(dto.dateTo) : undefined);
  }
}
