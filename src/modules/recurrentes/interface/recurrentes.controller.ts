import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreerRecurrenteUseCase } from '../application/use-cases/creer-recurrente.usecase';
import { ListerRecurrentesUseCase } from '../application/use-cases/lister-recurrentes.usecase';
import { ModifierRecurrenteUseCase } from '../application/use-cases/modifier-recurrente.usecase';
import { SupprimerRecurrenteUseCase } from '../application/use-cases/supprimer-recurrente.usecase';
import { ExecuterRecurrentesUseCase } from '../application/use-cases/executer-recurrentes.usecase';
import { CreerRecurrenteDto, ModifierRecurrenteDto } from './dtos/recurrente.dto';

@ApiTags('recurrentes')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recurrentes')
export class RecurrentesController {
  constructor(
    private readonly creerUC: CreerRecurrenteUseCase,
    private readonly listerUC: ListerRecurrentesUseCase,
    private readonly modifierUC: ModifierRecurrenteUseCase,
    private readonly supprimerUC: SupprimerRecurrenteUseCase,
    private readonly executerUC: ExecuterRecurrentesUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @ApiOperation({ summary: 'Créer une écriture récurrente (modèle)' })
  @ApiResponse({ status: 201, description: 'Écriture récurrente créée' })
  @ApiResponse({ status: 400, description: 'Modèle déséquilibré' })
  creer(@Body() dto: CreerRecurrenteDto, @CurrentUser() userId: number) {
    return this.creerUC.execute(dto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE, Role.DAF, Role.AUDITEUR)
  @ApiOperation({ summary: 'Lister mes écritures récurrentes' })
  lister(@CurrentUser() userId: number) {
    return this.listerUC.execute(userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @ApiOperation({ summary: 'Modifier une écriture récurrente' })
  @ApiResponse({ status: 404, description: 'Écriture récurrente introuvable' })
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierRecurrenteDto,
    @CurrentUser() userId: number,
  ) {
    return this.modifierUC.execute(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE, Role.COMPTABLE)
  @ApiOperation({ summary: 'Supprimer une écriture récurrente' })
  @ApiResponse({ status: 204, description: 'Supprimé' })
  @ApiResponse({ status: 404, description: 'Écriture récurrente introuvable' })
  supprimer(@Param('id', ParseIntPipe) id: number, @CurrentUser() userId: number) {
    return this.supprimerUC.execute(id, userId);
  }

  @Post('executer')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.CHEF_COMPTABLE)
  @ApiOperation({ summary: '[ADMIN] Déclencher manuellement l\'exécution des écritures dues' })
  @ApiResponse({ status: 200, description: 'Résultat : executed, errors' })
  executer() {
    return this.executerUC.execute();
  }
}
